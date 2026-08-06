/**
 * Shared shapes for the Daily Evidence Log.
 *
 * Deliberately framework-free and Prisma-free: the domain functions, the
 * repository and the UI all speak these, so none of them has to import each
 * other's machinery. The repository maps Prisma rows into these at its edge.
 */

import type { CalendarDate } from "./date";

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
