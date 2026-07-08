import { prisma } from "@/lib/prisma";

/** Codeforces is the only platform the trainer analyses (v2). */
export const CF_PLATFORM = "CF";

/**
 * All of a user's Codeforces problem logs, newest first, with the relations the
 * metrics + RAG layers need.
 */
export async function getCfProblems(userId: string) {
  return prisma.problemLog.findMany({
    where: { userId, platform: CF_PLATFORM },
    include: { tags: true, patterns: true, keyLearnings: true },
    orderBy: { created_at: "desc" },
  });
}

/** The concrete row shape returned by {@link getCfProblems}. */
export type CfProblem = Awaited<ReturnType<typeof getCfProblems>>[number];

/** Subset of logs belonging to one contest. */
export function byContest(logs: CfProblem[], contestId: string): CfProblem[] {
  return logs.filter((l) => (l.contest_id ?? "").trim() === contestId.trim());
}

/**
 * Distinct, non-empty CF `contest_id` values for a user (for the scope picker).
 * `contest_id` is free text and defaults to "", so empty/whitespace is filtered.
 */
export async function listCfContests(userId: string): Promise<string[]> {
  const rows = await prisma.problemLog.findMany({
    where: {
      userId,
      platform: CF_PLATFORM,
      NOT: { contest_id: null },
    },
    distinct: ["contest_id"],
    select: { contest_id: true },
    orderBy: { created_at: "desc" },
  });
  return rows
    .map((r) => (r.contest_id ?? "").trim())
    .filter((c) => c.length > 0);
}
