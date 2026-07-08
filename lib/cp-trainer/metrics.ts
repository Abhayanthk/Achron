/**
 * Deterministic CP metrics — pure functions over Codeforces `ProblemLog` rows.
 *
 * No LLM here. These are the trainer's "tools": interpretable numbers the agent
 * (Phase 2) calls to ground its coaching, and the snapshot persisted to
 * `TrainerReport.metrics`. Thresholds use the real field scales from
 * `LoggerForm` (stress/mental load 1-10; the solve_status / idea_source enums).
 */
import type { CfProblem } from "./queries";
import { byContest } from "./queries";

// ─── Predicates (grounded in LoggerForm enums) ───────────────────────────────

const HIGH_PSYCH = 7; // stress_level_during / mental_load_score are 1-10

/** A truly independent solve: clean status AND idea came from self. */
export function isCleanSelfSolve(p: CfProblem): boolean {
  return p.solve_status_type === "Solved Clean" && p.idea_source === "Self";
}

/** Solve that leaned on a hint or the editorial (idea or status). */
export function isAssisted(p: CfProblem): boolean {
  const assistedIdea =
    p.idea_source === "Small Hint" ||
    p.idea_source === "Major Hint" ||
    p.idea_source === "Editorial";
  const assistedStatus =
    p.solve_status_type === "Solved with Hint" ||
    p.solve_status_type === "Solved after Editorial";
  return assistedIdea || assistedStatus;
}

/** Not solved (partial or failed). */
export function isUnsolved(p: CfProblem): boolean {
  return p.solve_status_type === "Partial" || p.solve_status_type === "Failed";
}

function isSolved(p: CfProblem): boolean {
  return !isUnsolved(p);
}

/** total_time_minutes, falling back to the sum of the phase timers. */
function effectiveTotal(p: CfProblem): number {
  if (p.total_time_minutes > 0) return p.total_time_minutes;
  return (
    p.time_to_first_idea_minutes +
    p.implementation_time_minutes +
    p.debug_time_minutes
  );
}

// ─── Rating baseline ─────────────────────────────────────────────────────────

/** Expected solve-time (minutes) for a CF problem of the given rating. Tunable. */
export function ratingBaseline(rating: number): number {
  if (rating <= 800) return 8;
  if (rating <= 1100) return 12;
  if (rating <= 1400) return 20;
  if (rating <= 1700) return 30;
  if (rating <= 1900) return 40;
  if (rating <= 2100) return 55;
  return 75;
}

// ─── Time waste ──────────────────────────────────────────────────────────────

export type TimeWasteItem = {
  problemId: string;
  name: string;
  contestId: string | null;
  rating: number;
  totalMinutes: number;
  wastedMinutes: number;
  reasons: string[];
};

export type TimeWasteReport = {
  totalWastedMinutes: number;
  problemsAnalyzed: number;
  dominantSink: "overtime" | "debugging" | "resubmissions" | "none";
  breakdown: TimeWasteItem[];
  summary: string;
};

export function computeTimeWaste(logs: CfProblem[]): TimeWasteReport {
  let sumOvertime = 0;
  let sumDebug = 0;
  let sumResubmit = 0;

  const breakdown: TimeWasteItem[] = [];

  for (const p of logs) {
    const total = effectiveTotal(p);
    const baseline = ratingBaseline(p.rating);

    const overtime = Math.max(0, total - baseline);
    const debugThrash = Math.max(
      0,
      p.debug_time_minutes - Math.round(0.25 * total),
    );
    const resubmitWaste =
      p.attempt_count > 1
        ? (p.attempt_count - 1) * Math.round(0.1 * baseline)
        : 0;

    // Debug time is already part of `total`, so it overlaps with overtime — take
    // the larger of the two rather than double-counting, then add resubmits.
    const wasted = Math.min(total, Math.max(overtime, debugThrash) + resubmitWaste);

    const reasons: string[] = [];
    if (overtime > 0) reasons.push(`${overtime}m over the ~${baseline}m target`);
    if (debugThrash > 0) {
      const pct = total > 0 ? Math.round((p.debug_time_minutes / total) * 100) : 0;
      reasons.push(`${p.debug_time_minutes}m debugging (${pct}% of time)`);
    }
    if (p.attempt_count > 1) reasons.push(`${p.attempt_count} submissions`);

    sumOvertime += overtime;
    sumDebug += debugThrash;
    sumResubmit += resubmitWaste;

    if (wasted > 0 || reasons.length > 0) {
      breakdown.push({
        problemId: p.id,
        name: p.problem_name,
        contestId: p.contest_id,
        rating: p.rating,
        totalMinutes: total,
        wastedMinutes: wasted,
        reasons,
      });
    }
  }

  breakdown.sort((a, b) => b.wastedMinutes - a.wastedMinutes);

  const totalWastedMinutes = breakdown.reduce((s, b) => s + b.wastedMinutes, 0);

  let dominantSink: TimeWasteReport["dominantSink"] = "none";
  const max = Math.max(sumOvertime, sumDebug, sumResubmit);
  if (max > 0) {
    dominantSink =
      max === sumDebug
        ? "debugging"
        : max === sumResubmit
          ? "resubmissions"
          : "overtime";
  }

  const summary =
    breakdown.length === 0
      ? "No obvious time waste detected — times are within expected ranges."
      : `~${totalWastedMinutes}m likely wasted across ${breakdown.length} problem(s); biggest sink: ${dominantSink}.`;

  return {
    totalWastedMinutes,
    problemsAnalyzed: logs.length,
    dominantSink,
    breakdown,
    summary,
  };
}

// ─── Weakness ────────────────────────────────────────────────────────────────

export type WeakArea = {
  area: string;
  kind: "tag" | "pattern";
  count: number;
  assistedRate: number;
  evidence: string;
};

export type WeaknessReport = {
  totalProblems: number;
  selfSolveRate: number;
  failureCategories: { category: string; count: number }[];
  weakTags: WeakArea[];
  weakPatterns: WeakArea[];
  ratingCeiling: { maxSelfSolved: number; maxAttempted: number; gap: number };
  psychology: { highStressCount: number; highLoadCount: number; note: string };
};

type NamedRef = { name: string };

function weakAreasBy(
  logs: CfProblem[],
  pick: (p: CfProblem) => NamedRef[],
  kind: "tag" | "pattern",
): WeakArea[] {
  const total = new Map<string, number>();
  const assisted = new Map<string, number>();

  for (const p of logs) {
    const notClean = !isCleanSelfSolve(p);
    for (const ref of pick(p)) {
      total.set(ref.name, (total.get(ref.name) ?? 0) + 1);
      if (notClean) assisted.set(ref.name, (assisted.get(ref.name) ?? 0) + 1);
    }
  }

  const areas: WeakArea[] = [];
  for (const [area, count] of total) {
    const asst = assisted.get(area) ?? 0;
    const assistedRate = count > 0 ? asst / count : 0;
    // Weak = seen a few times AND at least half needed help.
    if (count >= 2 && assistedRate >= 0.5) {
      areas.push({
        area,
        kind,
        count,
        assistedRate,
        evidence: `${asst}/${count} not cleanly self-solved`,
      });
    }
  }

  areas.sort((a, b) => b.assistedRate - a.assistedRate || b.count - a.count);
  return areas;
}

export function aggregateWeakness(logs: CfProblem[]): WeaknessReport {
  // Failure categories
  const failureCounts = new Map<string, number>();
  for (const p of logs) {
    for (const cat of p.failure_categories) {
      failureCounts.set(cat, (failureCounts.get(cat) ?? 0) + 1);
    }
  }
  const failureCategories = [...failureCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const weakTags = weakAreasBy(logs, (p) => p.tags, "tag");
  const weakPatterns = weakAreasBy(logs, (p) => p.patterns, "pattern");

  // Rating ceiling
  const selfSolvedRatings = logs.filter(isCleanSelfSolve).map((p) => p.rating);
  const attemptedRatings = logs.map((p) => p.rating);
  const maxSelfSolved = selfSolvedRatings.length ? Math.max(...selfSolvedRatings) : 0;
  const maxAttempted = attemptedRatings.length ? Math.max(...attemptedRatings) : 0;

  // Psychology
  const highStressCount = logs.filter((p) => p.stress_level_during >= HIGH_PSYCH).length;
  const highLoadCount = logs.filter((p) => p.mental_load_score >= HIGH_PSYCH).length;

  const selfSolves = logs.filter(isCleanSelfSolve).length;
  const selfSolveRate = logs.length ? selfSolves / logs.length : 0;

  return {
    totalProblems: logs.length,
    selfSolveRate,
    failureCategories,
    weakTags,
    weakPatterns,
    ratingCeiling: {
      maxSelfSolved,
      maxAttempted,
      gap: Math.max(0, maxAttempted - maxSelfSolved),
    },
    psychology: {
      highStressCount,
      highLoadCount,
      note: `${highStressCount} high-stress, ${highLoadCount} high mental-load problem(s) (scale 1-10, ≥${HIGH_PSYCH}).`,
    },
  };
}

// ─── Scope assembly ──────────────────────────────────────────────────────────

export type Scope = "contest" | "overall";

export type ScopeMetrics = {
  scope: Scope;
  contestId: string | null;
  problemCount: number;
  solved: number;
  attempted: number;
  totalTimeMinutes: number;
  timeWaste: TimeWasteReport;
  weakness: WeaknessReport;
};

/** Selects the logs a report should cover for the given scope. */
export function selectScope(
  logs: CfProblem[],
  scope: Scope,
  contestId: string | null,
): CfProblem[] {
  if (scope === "contest" && contestId) return byContest(logs, contestId);
  return logs;
}

/** Full deterministic snapshot for a scope — the agent's grounding + persisted metrics. */
export function scopeMetrics(
  allLogs: CfProblem[],
  scope: Scope,
  contestId: string | null,
): ScopeMetrics {
  const logs = selectScope(allLogs, scope, contestId);
  return {
    scope,
    contestId: scope === "contest" ? contestId : null,
    problemCount: logs.length,
    solved: logs.filter(isSolved).length,
    attempted: logs.length,
    totalTimeMinutes: logs.reduce((s, p) => s + effectiveTotal(p), 0),
    timeWaste: computeTimeWaste(logs),
    weakness: aggregateWeakness(logs),
  };
}
