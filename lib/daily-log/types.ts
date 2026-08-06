/**
 * Shared shapes for the Daily Evidence Log.
 *
 * Deliberately framework-free and Prisma-free: the domain functions, the
 * repository and the UI all speak these, so none of them has to import each
 * other's machinery. The repository maps Prisma rows into these at its edge.
 */

import type { CalendarDate } from "./date";
import type { PageMode, RollingConsistency } from "./domain";

/** A core item's state on one particular card. */
export interface CoreStateSnapshot {
      coreItemId: string;
      /** Label as it read on the day the card was created. Never re-derived from CoreItem. */
      labelSnapshot: string;
      done: boolean;
}

/** One day's card. */
export interface DailyCardRecord {
      id: string;
      date: CalendarDate;
      /** Free-form bullets, one per line as entered. */
      did: string[];
      avoided: string | null;
      coreStates: CoreStateSnapshot[];
}

/** A pre-committed binary item. */
export interface CoreItemRecord {
      id: string;
      label: string;
      active: boolean;
      sortOrder: number;
}

/**
 * The minimum the heatmap and consistency rules need from a card.
 * Keeping this narrow means those rules can be tested with two-field literals.
 */
export interface CardCoreProgress {
      date: CalendarDate;
      coreDone: number;
      coreTotal: number;
}

/**
 * The whole page in one payload — what `GET /api/daily-log` returns.
 *
 * Lives here rather than beside the service so client components can import
 * the type without pulling the repository (and Prisma) into the bundle.
 */
export interface DailyLogPageData {
      /** Server's authoritative "today", in the app timezone. */
      today: CalendarDate;
      mode: PageMode;
      /** The core items to render on today's card. */
      coreItems: CoreItemRecord[];
      todayCard: DailyCardRecord | null;
      /**
       * Everything below is empty or null in `"re-entry"` mode — the client is
       * never given the history it would otherwise draw a gap with.
       */
      cardSummaries: CardCoreProgress[];
      recentCards: DailyCardRecord[];
      emptyBackfillDays: CalendarDate[];
      consistency: RollingConsistency | null;
}
