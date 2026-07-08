import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { batchEmbed, embedText, cosineSimilarity } from "@/lib/embeddings";
import { buildProblemText } from "@/lib/cp-trainer/problem-text";

export const runtime = "nodejs";

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
