/**
 * Shared "problem → embedding text" builder.
 *
 * Composes a rich, single-document text representation of a ProblemLog for
 * semantic search / RAG retrieval. Extracted from
 * `app/api/cp-tracker/semantic-search/route.ts` so the CP-trainer RAG layer and
 * the existing semantic search stay in sync (single source of truth).
 */
export type ProblemTextInput = {
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
};

export function buildProblemText(p: ProblemTextInput): string {
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
