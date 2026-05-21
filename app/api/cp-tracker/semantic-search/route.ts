import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { batchEmbed, embedText, cosineSimilarity } from "@/lib/embeddings";

export const runtime = "nodejs";

function buildProblemText(p: {
  problem_name: string;
  platform: string;
  pattern_subtype: string | null;
  solve_status_type: string;
  invariant_or_key_property: string | null;
  pattern_generalization_note: string;
  mistakes_text: string;
  edge_cases_found: string | null;
  learning_from_failure: string | null;
  core_tricks_used: string[];
  failure_categories: string[];
  tags: { name: string }[];
  patterns: { name: string }[];
  keyLearnings: { point: string }[];
}): string {
  const parts: string[] = [];
  parts.push(`Problem: ${p.problem_name}`);
  parts.push(`Platform: ${p.platform}`);
  if (p.tags.length) parts.push(`Tags: ${p.tags.map((t) => t.name).join(", ")}`);
  if (p.patterns.length)
    parts.push(`Patterns: ${p.patterns.map((x) => x.name).join(", ")}`);
  if (p.pattern_subtype) parts.push(`Subtype: ${p.pattern_subtype}`);
  if (p.invariant_or_key_property)
    parts.push(`Invariant: ${p.invariant_or_key_property}`);
  if (p.pattern_generalization_note)
    parts.push(`Generalization: ${p.pattern_generalization_note}`);
  if (p.core_tricks_used.length)
    parts.push(`Tricks: ${p.core_tricks_used.join(", ")}`);
  if (p.failure_categories.length)
    parts.push(`Failures: ${p.failure_categories.join(", ")}`);
  if (p.mistakes_text) parts.push(`Mistakes: ${p.mistakes_text}`);
  if (p.edge_cases_found) parts.push(`Edge cases: ${p.edge_cases_found}`);
  if (p.learning_from_failure)
    parts.push(`Learning: ${p.learning_from_failure}`);
  if (p.keyLearnings.length)
    parts.push(
      `Key learnings: ${p.keyLearnings.map((k) => k.point).join("; ")}`,
    );
  return parts.join("\n");
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 },
    );
  }

  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const query = (body.query || "").trim();
  if (!query) {
    return NextResponse.json({ scores: {} });
  }

  const problems = await prisma.problemLog.findMany({
    where: { userId },
    select: {
      id: true,
      problem_name: true,
      platform: true,
      pattern_subtype: true,
      solve_status_type: true,
      invariant_or_key_property: true,
      pattern_generalization_note: true,
      mistakes_text: true,
      edge_cases_found: true,
      learning_from_failure: true,
      core_tricks_used: true,
      failure_categories: true,
      tags: { select: { name: true } },
      patterns: { select: { name: true } },
      keyLearnings: { select: { point: true } },
    },
  });

  if (problems.length === 0) {
    return NextResponse.json({ scores: {} });
  }

  const items = problems.map((p) => ({
    key: `pl:${p.id}`,
    text: buildProblemText(p),
    id: p.id,
  }));

  const [queryVec, problemVecs] = await Promise.all([
    embedText(query),
    batchEmbed(items.map((it) => ({ key: it.key, text: it.text }))),
  ]);

  const scores: Record<string, number> = {};
  for (const it of items) {
    const v = problemVecs.get(it.key);
    if (!v) continue;
    scores[it.id] = cosineSimilarity(queryVec, v);
  }

  return NextResponse.json({ scores });
}
