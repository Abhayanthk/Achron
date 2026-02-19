/**
 * Spaced Repetition Revision System
 *
 * Schedule:
 *   Level 0 → Day 0   (same day reflection)
 *   Level 1 → Day 2   (re-solve without looking)
 *   Level 2 → Day 7   (re-solve from scratch)
 *   Level 3 → Day 21  (re-solve under time constraint)
 *   Level 4 → Day 60  (recall key invariant)
 *   Level 5 → Day 120 (final recall test)
 *   Level 6 → Permanent memory (done!)
 */

/** Days until next revision is due, indexed by rev_level */
export const REVISION_SCHEDULE = [0, 2, 7, 21, 60, 120] as const;

/** Human-readable label for each revision level */
export const REV_LEVEL_LABELS = [
  "lev 0",
  "lev 1",
  "lev 2",
  "lev 3",
  "lev 4",
  "lev 5",
  "Permanent",
] as const;

/** Short descriptions of what to do at each level */
export const REV_LEVEL_DESCRIPTIONS = [
  "Same day reflection",
  "Re-solve without looking",
  "Re-solve from scratch",
  "Re-solve under time constraint (5–10 min)",
  "Recall key invariant mentally",
  "Final recall test",
  "Permanent memory ✓",
] as const;

/**
 * Calculate the number of days since the last revision (or creation).
 * Uses `last_revised_date` if available, otherwise falls back to `created_at`.
 */
export function getDaysSinceLastRevision(
  lastRevisedDate: Date | string | null,
  createdAt: Date | string,
): number {
  const referenceDate = lastRevisedDate
    ? new Date(lastRevisedDate)
    : new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - referenceDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a revision is due for a problem.
 * - Level 6 (Permanent) → never due
 * - Otherwise → due if days since last revision >= schedule[level]
 */
export function isRevisionDue(
  lastRevisedDate: Date | string | null,
  revLevel: number,
  createdAt: Date | string,
): boolean {
  // Permanent memory — no more revisions needed
  if (revLevel >= 6) return false;

  const daysSince = getDaysSinceLastRevision(lastRevisedDate, createdAt);
  return daysSince >= REVISION_SCHEDULE[revLevel];
}

/**
 * Get the date when the next revision is due.
 * Returns null if the problem has reached permanent memory (level 6).
 */
export function getNextRevisionDate(
  lastRevisedDate: Date | string | null,
  revLevel: number,
  createdAt: Date | string,
): Date | null {
  if (revLevel >= 6) return null;

  const referenceDate = lastRevisedDate
    ? new Date(lastRevisedDate)
    : new Date(createdAt);
  const nextDate = new Date(referenceDate);
  nextDate.setDate(nextDate.getDate() + REVISION_SCHEDULE[revLevel]);
  return nextDate;
}

/**
 * Get the number of days overdue for revision.
 * Returns 0 if not yet due, negative values aren't returned.
 */
export function getDaysOverdue(
  lastRevisedDate: Date | string | null,
  revLevel: number,
  createdAt: Date | string,
): number {
  if (revLevel >= 6) return 0;

  const daysSince = getDaysSinceLastRevision(lastRevisedDate, createdAt);
  return Math.max(0, daysSince - REVISION_SCHEDULE[revLevel]);
}
