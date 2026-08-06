/**
 * Page assembly for the Daily Evidence Log: repository reads composed with
 * domain rules into exactly what the page needs, in one round trip.
 *
 * The re-entry decision lives here rather than in a component. When someone
 * returns after a gap, the server does not send the history at all — so no
 * rendering bug, no cached query and no stray `console.log` can put the gap
 * back on screen. The requirement is enforced by absence of data, not by a
 * conditional in JSX.
 */

import { today as resolveToday } from "./date";
import { emptyBackfillDays, pageMode, rollingConsistency } from "./domain";
import { RECENT_CARDS_LIMIT } from "./constants";
import {
      getCardByDate,
      getCardSummaries,
      getMostRecentCardDate,
      getRecentCards,
      listCoreItems,
} from "./repository";
import type { DailyLogPageData } from "./types";

export type { DailyLogPageData };

export async function getDailyLogPageData(
      userId: string,
      now: Date = new Date(),
): Promise<DailyLogPageData> {
      const today = resolveToday(now);

      const [mostRecent, coreItems, todayCard] = await Promise.all([
            getMostRecentCardDate(userId),
            listCoreItems(userId),
            getCardByDate(userId, today),
      ]);

      const mode = pageMode(mostRecent, today);

      if (mode === "re-entry") {
            return {
                  today,
                  mode,
                  coreItems,
                  todayCard,
                  cardSummaries: [],
                  recentCards: [],
                  emptyBackfillDays: [],
                  consistency: null,
            };
      }

      const [cardSummaries, recentCards] = await Promise.all([
            getCardSummaries(userId),
            getRecentCards(userId, RECENT_CARDS_LIMIT),
      ]);

      const cardDates = cardSummaries.map((summary) => summary.date);

      return {
            today,
            mode,
            coreItems,
            todayCard,
            cardSummaries,
            recentCards,
            emptyBackfillDays: emptyBackfillDays(cardDates, today),
            consistency: rollingConsistency(cardDates, today),
      };
}
