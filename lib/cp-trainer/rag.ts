/**
 * RAG retrieval for the CP trainer: given a problem the user struggled with,
 * surface the most similar problems they have already solved cleanly — concrete
 * study anchors for the agent's drill recommendations.
 *
 * Reuses the existing embedding stack (`lib/embeddings.ts`) and the shared
 * problem→text builder, so retrieval stays consistent with semantic search.
 */
import { batchEmbed, cosineSimilarity, embedText } from "@/lib/embeddings";
import { buildProblemText } from "./problem-text";
import { getCfProblems, type CfProblem } from "./queries";
import { isUnsolved } from "./metrics";

export type SimilarProblem = {
  id: string;
  name: string;
  rating: number;
  similarity: number;
};

/**
 * Top-k solved CF problems most similar to `problemId` (excluding itself).
 * "Solved" = anything not Partial/Failed, so hints/editorial solves still count
 * as study references.
 */
export async function findSimilarSolvedProblems(
  userId: string,
  problemId: string,
  k = 5,
  preloaded?: CfProblem[],
): Promise<SimilarProblem[]> {
  const logs = preloaded ?? (await getCfProblems(userId));
  const target = logs.find((l) => l.id === problemId);
  if (!target) return [];

  const candidates = logs.filter((l) => l.id !== problemId && !isUnsolved(l));
  if (candidates.length === 0) return [];

  const [targetVec, candVecs] = await Promise.all([
    embedText(buildProblemText(target)),
    batchEmbed(
      candidates.map((c) => ({ key: `pl:${c.id}`, text: buildProblemText(c) })),
    ),
  ]);

  return candidates
    .map((c) => {
      const v = candVecs.get(`pl:${c.id}`);
      return {
        id: c.id,
        name: c.problem_name,
        rating: c.rating,
        similarity: v ? cosineSimilarity(targetVec, v) : 0,
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}
