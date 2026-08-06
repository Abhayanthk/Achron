/**
 * Domain rules for the Daily Evidence Log.
 *
 * Pure functions: no React, no Prisma, no clock. Every one of them takes
 * "today" as an argument rather than reading it, which is what makes the
 * boundaries (30-day edge, 3-day backfill edge, 5-day re-entry edge) testable
 * instead of hopeful.
 *
 * Two invariants hold across this whole file:
 *   - Nothing here can decrease as a penalty. There is no score to lose.
 *   - A day without a card is absence of data, never evidence of failure, and
 *     is never distinguished by anything harsher than the neutral level 0.
 */

import {
      addDays,
      compareCalendarDates,
      daysBetween,
      daysEndingAt,
      differenceInDays,
      type CalendarDate,
} from "./date";
import {
      BACKFILL_WINDOW_DAYS,
      HEATMAP_DEFAULT_DAYS,
      RE_ENTRY_THRESHOLD_DAYS,
      ROLLING_WINDOW_DAYS,
} from "./constants";
import type { CardCoreProgress, DailyCardRecord } from "./types";

// ---------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------

/** Reduce a full card to what the heatmap and metrics actually read. */
export function summarizeCard(card: DailyCardRecord): CardCoreProgress {
      return {
            date: card.date,
            coreDone: card.coreStates.filter((state) => state.done).length,
            coreTotal: card.coreStates.length,
      };
}

// ---------------------------------------------------------------------------
// Rolling consistency — the one headline metric
// ---------------------------------------------------------------------------

export interface RollingConsistency {
      /** Days in the window that have a card. */
      daysLogged: number;
      windowDays: number;
      /** `daysLogged / windowDays`, rounded to a whole percent. */
      percentage: number;
      /** Oldest day counted, inclusive. */
      windowStart: CalendarDate;
      /** Newest day counted, inclusive — i.e. today. */
      windowEnd: CalendarDate;
}

/**
 * Days logged in the last `windowDays` calendar days, inclusive of today.
 *
 * Duplicate dates count once and days outside the window are ignored, so the
 * result is always a true rate of showing up in `0..windowDays`. Because the
 * window slides one day at a time, the value moves by at most 1 per day — it
 * cannot be wiped out by a single miss, which is the entire point.
 */
export function rollingConsistency(
      cardDates: readonly CalendarDate[],
      today: CalendarDate,
      windowDays: number = ROLLING_WINDOW_DAYS,
): RollingConsistency {
      const windowStart = addDays(today, -(windowDays - 1));

      const logged = new Set<CalendarDate>();
      for (const date of cardDates) {
            const withinWindow =
                  compareCalendarDates(date, windowStart) >= 0 &&
                  compareCalendarDates(date, today) <= 0;
            if (withinWindow) logged.add(date);
      }

      return {
            daysLogged: logged.size,
            windowDays,
            percentage: Math.round((logged.size / windowDays) * 100),
            windowStart,
            windowEnd: today,
      };
}

// ---------------------------------------------------------------------------
// Heatmap bucketing
// ---------------------------------------------------------------------------

/**
 * Colour intensity, driven only by the fraction of core items completed —
 * never by bullet or word count, which are trivially gamed by typing more.
 *
 *   0 — no card. Neutral gray. Not a failure state.
 *   1 — card exists, no core items done. Lowest *non-gray* tint: logging is
 *       itself an action and has to register visually.
 *   2 — some core done, under half.
 *   3 — at least half done, not all.
 *   4 — all core items done.
 */
export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatmapCell {
      date: CalendarDate;
      level: HeatmapLevel;
      hasCard: boolean;
      coreDone: number;
      coreTotal: number;
}

/** Level for one day. `hasCard === false` is always 0, whatever the counts say. */
export function heatmapLevel(
      hasCard: boolean,
      coreDone: number,
      coreTotal: number,
): HeatmapLevel {
      if (!hasCard) return 0;
      // A card with no core items committed still logged something.
      if (coreTotal <= 0 || coreDone <= 0) return 1;

      const fraction = coreDone / coreTotal;
      if (fraction >= 1) return 4;
      if (fraction >= 0.5) return 3;
      return 2;
}

/**
 * One cell per day in `window`, in the order given. Days without a card are
 * included at level 0 — the window is a calendar, not a list of hits.
 */
export function buildHeatmap(
      cards: readonly CardCoreProgress[],
      window: readonly CalendarDate[],
): HeatmapCell[] {
      const byDate = new Map(cards.map((card) => [card.date, card]));

      return window.map((date) => {
            const card = byDate.get(date);
            return {
                  date,
                  level: heatmapLevel(Boolean(card), card?.coreDone ?? 0, card?.coreTotal ?? 0),
                  hasCard: Boolean(card),
                  coreDone: card?.coreDone ?? 0,
                  coreTotal: card?.coreTotal ?? 0,
            };
      });
}

/** Default window: the most recent `length` days, oldest first. */
export function recentWindow(
      today: CalendarDate,
      length: number = HEATMAP_DEFAULT_DAYS,
): CalendarDate[] {
      return daysEndingAt(today, length);
}

/**
 * All-time window: earliest card through today, oldest first.
 * With no cards it degenerates to today alone rather than an empty grid.
 */
export function allTimeWindow(
      cardDates: readonly CalendarDate[],
      today: CalendarDate,
): CalendarDate[] {
      if (cardDates.length === 0) return [today];

      const earliest = cardDates.reduce((min, date) =>
            compareCalendarDates(date, min) < 0 ? date : min,
      );
      // Guard against a card dated ahead of today: never render a window that
      // runs backwards.
      if (compareCalendarDates(earliest, today) > 0) return [today];

      return daysBetween(earliest, today);
}

// ---------------------------------------------------------------------------
// Backfill eligibility
// ---------------------------------------------------------------------------

/**
 * `"editable"`  — today, or within the backfill window.
 * `"read-only"` — older than the window. Visible forever, but immutable.
 * `"future"`    — not a day that has happened; never writable.
 */
export type CardEditability = "editable" | "read-only" | "future";

export function editabilityOf(
      date: CalendarDate,
      today: CalendarDate,
      windowDays: number = BACKFILL_WINDOW_DAYS,
): CardEditability {
      const age = differenceInDays(today, date);
      if (age < 0) return "future";
      if (age <= windowDays) return "editable";
      return "read-only";
}

/**
 * The server-side gate for writes. The UI hides ineligible days too, but this
 * is the check that actually enforces the rule.
 */
export function canEditCard(
      date: CalendarDate,
      today: CalendarDate,
      windowDays: number = BACKFILL_WINDOW_DAYS,
): boolean {
      return editabilityOf(date, today, windowDays) === "editable";
}

/**
 * Backfillable days that have no card yet, oldest first, excluding today —
 * today gets the main editor, so it is never a "still empty" prompt.
 *
 * Feeds plain copy ("Yesterday is still empty — add it"). Surfacing, not
 * nagging: no counts of what was missed, no warning colours downstream.
 */
export function emptyBackfillDays(
      cardDates: readonly CalendarDate[],
      today: CalendarDate,
      windowDays: number = BACKFILL_WINDOW_DAYS,
): CalendarDate[] {
      const logged = new Set(cardDates);
      return daysEndingAt(addDays(today, -1), windowDays).filter(
            (date) => !logged.has(date),
      );
}

// ---------------------------------------------------------------------------
// Re-entry
// ---------------------------------------------------------------------------

/**
 * `"re-entry"` — render today's empty card and nothing else. No heatmap, no
 *                metrics, no gap messaging.
 * `"full"`     — the normal three-section page.
 */
export type PageMode = "re-entry" | "full";

/**
 * Which page to render, from the most recent card's date.
 *
 * Re-entry when the gap exceeds `thresholdDays`, and also when there is no
 * history at all: a first-time user gets the same single empty box rather than
 * a grid of gray. Once today's card is saved the gap is 0 and the next load is
 * `"full"`.
 */
export function pageMode(
      mostRecentCardDate: CalendarDate | null,
      today: CalendarDate,
      thresholdDays: number = RE_ENTRY_THRESHOLD_DAYS,
): PageMode {
      if (mostRecentCardDate === null) return "re-entry";

      const gap = differenceInDays(today, mostRecentCardDate);
      // A future-dated card means no gap to speak of; don't hide the page.
      if (gap < 0) return "full";

      return gap > thresholdDays ? "re-entry" : "full";
}

/** Most recent card date, or `null` for empty history. */
export function mostRecentCardDate(
      cardDates: readonly CalendarDate[],
): CalendarDate | null {
      if (cardDates.length === 0) return null;
      return cardDates.reduce((max, date) =>
            compareCalendarDates(date, max) > 0 ? date : max,
      );
}
