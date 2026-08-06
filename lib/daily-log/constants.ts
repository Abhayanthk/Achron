/**
 * Tuning constants for the Daily Evidence Log.
 *
 * These numbers are the feature, not incidental config — each one exists to
 * keep the log survivable after a gap. Changing one changes the psychology,
 * so the reasoning lives next to the value.
 */

/**
 * Rolling consistency window. The headline metric is "days logged in the last
 * 30". A sliding window moves by at most 1 per day in either direction, so a
 * single miss can never collapse it — unlike a consecutive-day count, which
 * resets to zero the moment one day is missed.
 */
export const ROLLING_WINDOW_DAYS = 30;

/**
 * How far back a card may still be created or edited. Past this, days are
 * read-only: the log is a record of what happened, not a document to be
 * rewritten later.
 */
export const BACKFILL_WINDOW_DAYS = 3;

/**
 * Gap length after which the page drops to the re-entry view (empty card only).
 * Strictly greater than this many days since the most recent card.
 *
 * A full-history view on the day someone returns leads with the gap — the app's
 * first act would be showing evidence that they quit. That loop must not exist.
 */
export const RE_ENTRY_THRESHOLD_DAYS = 5;

/** Days shown in the default heatmap. Recent enough to be about now, not about the archive. */
export const HEATMAP_DEFAULT_DAYS = 21;

/** How many cards the recent list renders. */
export const RECENT_CARDS_LIMIT = 14;
