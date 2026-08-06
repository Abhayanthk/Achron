/**
 * CP Trainer agent — AgentKit (@inngest/agent-kit) tool-calling loop.
 *
 * Deterministic tools (Phase 1 metrics + RAG) do the math; the LLM orchestrates:
 * it inspects the worst time-sinks and weakest topics via tools, then a final
 * structured pass coerces everything into a strict `CoachingReport`.
 *
 * Runs inside the `cp-trainer-analysis` Inngest function: AgentKit detects the
 * step context automatically, so every model call becomes a durable
 * `step.ai.infer` (memoized across replays, retried on 429 per the function's
 * `retries` config — no hand-rolled backoff here).
 *
 * Models: loop on `gemini-2.5-flash` (GEMINI_LOOP_MODEL — see LOOP_MODEL note),
 * finalize on `gemini-3.5-flash` (GEMINI_TRAINER_MODEL). Embeddings for RAG
 * stay on `gemini-embedding-001` (see lib/embeddings.ts).
 */
import {
  createAgent,
  createNetwork,
  createState,
  createTool,
  gemini,
  getStepTools,
  type AgentResult,
  type Message,
  type ToolResultMessage,
  type Tool,
} from "@inngest/agent-kit";
import { z } from "zod";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { REVISION_SCHEDULE, REV_LEVEL_DESCRIPTIONS } from "@/lib/revision";
import { getCfProblems, type CfProblem } from "./queries";
import {
  scopeMetrics,
  selectScope,
  type Scope,
  type ScopeMetrics,
} from "./metrics";
import { findSimilarSolvedProblems } from "./rag";

const TRAINER_MODEL = process.env.GEMINI_TRAINER_MODEL || "gemini-3.5-flash";
/**
 * Model for the tool-calling loop. Gemini 3.x rejects function-calling turns
 * whose functionCall parts lack the thoughtSignature ("Function call is missing
 * a thought_signature", HTTP 400), and AgentKit's Gemini adapter (≤0.13.x)
 * drops signatures when rebuilding history. Gemini 2.5 tolerates the omission,
 * so the loop stays on 2.5 until the adapter round-trips signatures. The
 * finalize pass makes no tool calls, so it stays on TRAINER_MODEL.
 */
const LOOP_MODEL = process.env.GEMINI_LOOP_MODEL || "gemini-2.5-flash";
/** Max agent iterations (inference calls) before the network is cut off. */
const MAX_STEPS = 6;

// ─── Report shape ────────────────────────────────────────────────────────────

export type CoachingReport = {
  headline: string;
  timeWasted: {
    totalWastedMinutes: number;
    summary: string;
    breakdown: { problemName: string; wastedMinutes: number; reason: string }[];
  };
  weaknesses: { area: string; evidence: string; severity: "low" | "medium" | "high" }[];
  rootCauses: string;
  actionPlan: { step: string; why: string; how: string }[];
  drills: { topic: string; targetRating: string; examples: string[] }[];
  nextContestStrategy: string;
};

export type TraceEntry = { step: number; tool: string; args: unknown; ok: boolean };

export type TrainerAgentResult = {
  report: CoachingReport;
  metrics: ScopeMetrics;
  trace: TraceEntry[];
  model: string | null;
};

// Gemini responseSchema mirroring CoachingReport (drives the structured finalize).
const REPORT_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    headline: { type: SchemaType.STRING },
    timeWasted: {
      type: SchemaType.OBJECT,
      properties: {
        totalWastedMinutes: { type: SchemaType.NUMBER },
        summary: { type: SchemaType.STRING },
        breakdown: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              problemName: { type: SchemaType.STRING },
              wastedMinutes: { type: SchemaType.NUMBER },
              reason: { type: SchemaType.STRING },
            },
            required: ["problemName", "wastedMinutes", "reason"],
          },
        },
      },
      required: ["totalWastedMinutes", "summary", "breakdown"],
    },
    weaknesses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          area: { type: SchemaType.STRING },
          evidence: { type: SchemaType.STRING },
          severity: { type: SchemaType.STRING, format: "enum", enum: ["low", "medium", "high"] },
        },
        required: ["area", "evidence", "severity"],
      },
    },
    rootCauses: { type: SchemaType.STRING },
    actionPlan: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          step: { type: SchemaType.STRING },
          why: { type: SchemaType.STRING },
          how: { type: SchemaType.STRING },
        },
        required: ["step", "why", "how"],
      },
    },
    drills: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          targetRating: { type: SchemaType.STRING },
          examples: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["topic", "targetRating", "examples"],
      },
    },
    nextContestStrategy: { type: SchemaType.STRING },
  },
  required: [
    "headline",
    "timeWasted",
    "weaknesses",
    "rootCauses",
    "actionPlan",
    "drills",
    "nextContestStrategy",
  ],
};

// ─── Prompts ─────────────────────────────────────────────────────────────────

// Spaced-repetition facts are inlined (not a tool): Gemini rejects zero-param
// functions, and a static lookup isn't worth a rate-limited round-trip.
const SYSTEM_PROMPT = `You are a world-class competitive-programming coach specialised in Codeforces.
You are given deterministic metrics about a user's saved problems (these numbers are ground truth — never contradict them).
Your job: diagnose WHERE the user wastes time, WHAT their recurring weaknesses are, and HOW to fix them.

Use the provided tools to investigate before concluding:
- getProblemDetail on the biggest time-sinks and unsolved/assisted problems to read their mistakes and key ideas.
- findSimilarSolvedProblems to pick concrete drill anchors from problems the user already cracked.
- getProblems for a fuller list if you need to pick which problems to inspect.

Spaced-repetition ground truth (for revision advice): days per rev level = [${REVISION_SCHEDULE.join(", ")}]; levels: ${Object.entries(REV_LEVEL_DESCRIPTIONS)
  .map(([lvl, desc]) => `${lvl}: ${desc}`)
  .join("; ")}.

Investigate efficiently (a handful of targeted tool calls), then STOP calling tools and write a concise analyst summary in plain prose covering: time wasted (with the worst offenders and why), the top weaknesses with evidence, the likely root causes, a concrete step-by-step improvement plan, specific drills, and an in-contest strategy. Do not output JSON — a separate step will format it.`;

const FINALIZE_PROMPT = `You convert an analyst's coaching notes and the ground-truth metrics into the strict CoachingReport JSON.
Rules: ground every number in METRICS (especially timeWasted). Keep advice specific and actionable for Codeforces. Use problem names from the data. If time data is all zero, say so plainly in the timeWasted summary and focus on weaknesses and strategy.`;

// ─── Compact serializers (token budget) ──────────────────────────────────────

function compactProblem(p: CfProblem) {
  return {
    id: p.id,
    name: p.problem_name,
    rating: p.rating,
    contestId: p.contest_id,
    status: p.solve_status_type,
    ideaSource: p.idea_source,
    attempts: p.attempt_count,
    times: {
      firstIdea: p.time_to_first_idea_minutes,
      impl: p.implementation_time_minutes,
      debug: p.debug_time_minutes,
      total: p.total_time_minutes,
    },
    failures: p.failure_categories,
    tags: p.tags.map((t) => t.name),
    patterns: p.patterns.map((x) => x.name),
  };
}

function problemDetail(p: CfProblem) {
  const snippets = Array.isArray(p.code_snippets)
    ? (p.code_snippets as { name?: string; language?: string; tries?: number }[]).map((s) => ({
        name: s?.name,
        language: s?.language,
        tries: s?.tries,
      }))
    : [];
  return {
    ...compactProblem(p),
    mistakes: p.mistakes_text,
    invariant: p.invariant_or_key_property,
    generalization: p.pattern_generalization_note,
    learningFromFailure: p.learning_from_failure,
    edgeCases: p.edge_cases_found,
    tricks: p.core_tricks_used,
    keyLearnings: p.keyLearnings.map((k) => k.point),
    revLevel: p.rev_level,
    mustRevisit: p.must_revisit,
    codeSnippets: snippets,
  };
}

/** Trim metric arrays so the prompt stays bounded regardless of library size. */
function compactMetricsForPrompt(m: ScopeMetrics) {
  return {
    scope: m.scope,
    contestId: m.contestId,
    problemCount: m.problemCount,
    solved: m.solved,
    totalTimeMinutes: m.totalTimeMinutes,
    timeWaste: {
      totalWastedMinutes: m.timeWaste.totalWastedMinutes,
      dominantSink: m.timeWaste.dominantSink,
      summary: m.timeWaste.summary,
      breakdown: m.timeWaste.breakdown.slice(0, 15),
    },
    weakness: {
      selfSolveRate: m.weakness.selfSolveRate,
      failureCategories: m.weakness.failureCategories.slice(0, 8),
      weakTags: m.weakness.weakTags.slice(0, 8),
      weakPatterns: m.weakness.weakPatterns.slice(0, 8),
      ratingCeiling: m.weakness.ratingCeiling,
      psychology: m.weakness.psychology,
    },
  };
}

// ─── Tools ───────────────────────────────────────────────────────────────────

type Ctx = {
  userId: string;
  allLogs: CfProblem[];
  scope: Scope;
  contestId: string | null;
};

/** Tools close over the run's context so handlers stay pure in-memory lookups. */
function buildTools(ctx: Ctx) {
  const getProblems = createTool({
    name: "getProblems",
    description:
      "List CF problems in a scope with timings, verdicts, tags and failure categories.",
    parameters: z.object({
      scope: z
        .enum(["contest", "overall"])
        .optional()
        .describe("Which slice to analyse; defaults to the run's scope."),
      contestId: z.string().optional(),
    }),
    handler: async (input) => {
      const scope = (input.scope as Scope) ?? ctx.scope;
      const contestId = input.contestId ?? ctx.contestId;
      const logs = selectScope(ctx.allLogs, scope, contestId);
      return { problems: logs.slice(0, 40).map(compactProblem) };
    },
  });

  const getProblemDetail = createTool({
    name: "getProblemDetail",
    description:
      "Full detail for one problem: mistakes, key idea, learnings, tricks, code snippet metadata.",
    parameters: z.object({ problemId: z.string() }),
    handler: async (input) => {
      const p = ctx.allLogs.find((l) => l.id === input.problemId);
      return p ? problemDetail(p) : { error: "problem not found" };
    },
  });

  const findSimilar = createTool({
    name: "findSimilarSolvedProblems",
    description:
      "Top-k already-solved CF problems most similar to a given one — drill anchors.",
    parameters: z.object({
      problemId: z.string(),
      k: z.number().optional(),
    }),
    // Embedding API calls inside — memoize via step.run so Inngest replays
    // don't re-embed the whole library.
    handler: async (input, opts?: Tool.Options<Record<string, unknown>>) => {
      const run = () =>
        findSimilarSolvedProblems(ctx.userId, input.problemId, input.k ?? 5, ctx.allLogs);
      const similar = opts?.step
        ? await opts.step.run(`similar-to-${input.problemId}`, run)
        : await run();
      return { similar };
    },
  });

  return [getProblems, getProblemDetail, findSimilar];
}

// ─── Fallback (no key / errors / empty) ──────────────────────────────────────

function severityFor(rate: number): "low" | "medium" | "high" {
  if (rate >= 0.75) return "high";
  if (rate >= 0.5) return "medium";
  return "low";
}

function buildMetricsOnlyReport(m: ScopeMetrics, note: string): CoachingReport {
  const tw = m.timeWaste;
  const w = m.weakness;
  return {
    headline: `${m.problemCount} CF problem(s) analysed — clean self-solve rate ${(w.selfSolveRate * 100).toFixed(0)}%.`,
    timeWasted: {
      totalWastedMinutes: tw.totalWastedMinutes,
      summary: tw.summary,
      breakdown: tw.breakdown.slice(0, 10).map((b) => ({
        problemName: b.name,
        wastedMinutes: b.wastedMinutes,
        reason: b.reasons.join("; "),
      })),
    },
    weaknesses: [
      ...w.weakTags.slice(0, 5).map((t) => ({
        area: `tag: ${t.area}`,
        evidence: t.evidence,
        severity: severityFor(t.assistedRate),
      })),
      ...w.weakPatterns.slice(0, 5).map((t) => ({
        area: `pattern: ${t.area}`,
        evidence: t.evidence,
        severity: severityFor(t.assistedRate),
      })),
      ...w.failureCategories.slice(0, 5).map((f) => ({
        area: `failure: ${f.category}`,
        evidence: `${f.count} occurrence(s)`,
        severity: "medium" as const,
      })),
    ],
    rootCauses: `Deterministic report (${note}). Based on metrics only — no LLM synthesis.`,
    actionPlan: [
      {
        step: "Fix the top weakness first",
        why: "Highest-frequency assisted topic is the cheapest rating to reclaim.",
        how: "Do 5 focused problems on the weakest tag/pattern above, self-solve only.",
      },
      {
        step: "Revise assisted solves",
        why: "Problems you needed hints for are not yet internalised.",
        how: "Re-solve from scratch on the spaced-repetition schedule.",
      },
    ],
    drills: w.weakTags.slice(0, 3).map((t) => ({
      topic: t.area,
      targetRating: `${w.ratingCeiling.maxSelfSolved || 1200}`,
      examples: [],
    })),
    nextContestStrategy:
      tw.dominantSink === "debugging"
        ? "Slow down before coding — dry-run on paper to cut debugging time."
        : "Allocate time per problem by rating; skip and return rather than overtime-ing a single problem.",
  };
}

function emptyReport(scope: Scope, contestId: string | null): CoachingReport {
  const where = scope === "contest" && contestId ? `contest "${contestId}"` : "your Codeforces library";
  return {
    headline: `No Codeforces problems found for ${where}.`,
    timeWasted: { totalWastedMinutes: 0, summary: "Nothing to analyse yet.", breakdown: [] },
    weaknesses: [],
    rootCauses: "Log some CF problems (with time fields filled) to get a diagnosis.",
    actionPlan: [
      {
        step: "Log your contest problems",
        why: "The trainer needs data to find your patterns.",
        how: "Use Log Problem after each contest and fill the time-to-first-idea / implementation / debug fields.",
      },
    ],
    drills: [],
    nextContestStrategy: "Track your time per problem so the trainer can spot where it goes.",
  };
}

// ─── AgentKit run helpers ────────────────────────────────────────────────────

/**
 * Gemini rejects (HTTP 400) any history where a functionCall turn is not
 * immediately followed by its functionResponse. AgentKit formats parallel tool
 * calls as [call, call, result, result], so re-pair each call with its result
 * (matched by tool name, order-preserving for duplicates) before inference.
 */
function interleaveToolPairs(history: Message[]): Message[] {
  const out: Message[] = [];
  let i = 0;
  while (i < history.length) {
    if (history[i].type !== "tool_call") {
      out.push(history[i]);
      i++;
      continue;
    }
    const calls: Message[] = [];
    while (i < history.length && history[i].type === "tool_call") calls.push(history[i++]);
    const results: ToolResultMessage[] = [];
    while (i < history.length && history[i].type === "tool_result")
      results.push(history[i++] as ToolResultMessage);

    const remaining = [...results];
    for (const call of calls) {
      out.push(call);
      const name = call.type === "tool_call" ? call.tools[0]?.name : undefined;
      const idx = remaining.findIndex((r) => r.tool.name === name);
      if (idx >= 0) out.push(...remaining.splice(idx, 1));
    }
    out.push(...remaining);
  }
  return out;
}

/** Last assistant prose from the agent's results — the analyst notes. */
function extractAnalysisText(results: AgentResult[]): string {
  for (let i = results.length - 1; i >= 0; i--) {
    for (let j = results[i].output.length - 1; j >= 0; j--) {
      const msg = results[i].output[j];
      if (msg.type === "text" && msg.role === "assistant") {
        return typeof msg.content === "string"
          ? msg.content
          : msg.content.map((c) => c.text).join("");
      }
    }
  }
  return "";
}

/** Flatten each iteration's tool calls into the persisted trace. */
function extractTrace(results: AgentResult[]): TraceEntry[] {
  return results.flatMap((r, i) =>
    r.toolCalls.map((tc) => ({
      step: i,
      tool: tc.tool.name,
      args: tc.tool.input,
      ok: !(
        typeof tc.content === "object" &&
        tc.content !== null &&
        "error" in tc.content
      ),
    })),
  );
}

// ─── Main entry ──────────────────────────────────────────────────────────────

export async function runTrainerAgent(
  userId: string,
  scope: Scope,
  contestId: string | null,
): Promise<TrainerAgentResult> {
  const allLogs = await getCfProblems(userId);
  const metrics = scopeMetrics(allLogs, scope, contestId);

  if (metrics.problemCount === 0) {
    return { report: emptyReport(scope, contestId), metrics, trace: [], model: null };
  }
  if (!process.env.GEMINI_API_KEY) {
    return {
      report: buildMetricsOnlyReport(metrics, "GEMINI_API_KEY not set"),
      metrics,
      trace: [],
      model: null,
    };
  }

  const ctx: Ctx = { userId, allLogs, scope, contestId };
  const modelLabel = `${LOOP_MODEL} + ${TRAINER_MODEL}`;
  const model = gemini({
    model: LOOP_MODEL,
    apiKey: process.env.GEMINI_API_KEY,
  });

  const coach = createAgent({
    name: "cp-trainer-coach",
    description: "Diagnoses Codeforces time waste and weaknesses from logged solves.",
    system: SYSTEM_PROMPT,
    model,
    tools: buildTools(ctx),
    lifecycle: {
      onStart: ({ prompt, history }) => ({
        prompt,
        history: interleaveToolPairs(history ?? []),
        stop: false,
      }),
    },
  });

  // Single agent + deterministic router: keep re-invoking the coach while its
  // last turn called tools; stop as soon as it answers in prose. The network
  // (not Agent.run's maxIter) is what carries tool results into the next turn.
  const network = createNetwork({
    name: "cp-trainer",
    agents: [coach],
    defaultModel: model,
    maxIter: MAX_STEPS,
    router: ({ callCount, lastResult }) => {
      if (callCount === 0) return coach;
      if (lastResult && lastResult.toolCalls.length > 0) return coach;
      return undefined;
    },
  });

  const initialPrompt = `Analyse this ${scope === "contest" ? `contest ("${contestId}")` : "overall Codeforces"} data and coach the user.\n\nMETRICS (ground truth):\n${JSON.stringify(compactMetricsForPrompt(metrics))}`;

  // Own state handle so a mid-loop failure still yields the partial trace.
  const state = createState({});
  let results: AgentResult[];
  try {
    const run = await network.run(initialPrompt, { state });
    results = run.state.results;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      report: buildMetricsOnlyReport(metrics, `LLM loop error: ${msg}`),
      metrics,
      trace: extractTrace(state.results),
      model: modelLabel,
    };
  }

  const trace = extractTrace(results);
  const analysisText = extractAnalysisText(results);

  try {
    const report = await finalizeReport(metrics, analysisText);
    return { report, metrics, trace, model: modelLabel };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      report: buildMetricsOnlyReport(metrics, `Finalize failed: ${msg}`),
      metrics,
      trace,
      model: modelLabel,
    };
  }
}

/**
 * Structured finalize: one generateContent call with a strict responseSchema.
 * Wrapped in step.run when an Inngest step context exists so it's memoized
 * across replays and 429s are retried by Inngest instead of in-process.
 */
async function finalizeReport(
  metrics: ScopeMetrics,
  analysisText: string,
): Promise<CoachingReport> {
  const generate = async (): Promise<CoachingReport> => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const finalizer = genAI.getGenerativeModel({
      model: TRAINER_MODEL,
      systemInstruction: FINALIZE_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: REPORT_SCHEMA as never,
      },
    });
    const fin = await finalizer.generateContent(
      `METRICS (ground truth):\n${JSON.stringify(compactMetricsForPrompt(metrics))}\n\nANALYST NOTES:\n${analysisText}\n\nReturn the CoachingReport JSON.`,
    );
    return JSON.parse(fin.response.text()) as CoachingReport;
  };

  const step = await getStepTools();
  return step ? ((await step.run("finalize-report", generate)) as CoachingReport) : generate();
}
