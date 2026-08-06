import { describe, expect, it } from "vitest";

import { addDays, daysEndingAt } from "./date";
import {
      allTimeWindow,
      buildHeatmap,
      canEditCard,
      editabilityOf,
      emptyBackfillDays,
      heatmapLevel,
      mostRecentCardDate,
      pageMode,
      recentWindow,
      rollingConsistency,
      summarizeCard,
} from "./domain";
import type { DailyCardRecord } from "./types";

const TODAY = "2026-08-06";

/** Card `n` days before TODAY. */
const daysAgo = (n: number) => addDays(TODAY, -n);

describe("summarizeCard", () => {
      it("counts completed core states", () => {
            const card: DailyCardRecord = {
                  id: "c1",
                  date: TODAY,
                  did: ["shipped the repository layer"],
                  avoided: "opening twitter before noon",
                  coreStates: [
                        { coreItemId: "a", labelSnapshot: "One problem", done: true },
                        { coreItemId: "b", labelSnapshot: "One log", done: false },
                        { coreItemId: "c", labelSnapshot: "Read 10 pages", done: true },
                  ],
            };
            expect(summarizeCard(card)).toEqual({ date: TODAY, coreDone: 2, coreTotal: 3 });
      });

      it("handles a card with no core items", () => {
            const card: DailyCardRecord = {
                  id: "c2",
                  date: TODAY,
                  did: ["something"],
                  avoided: null,
                  coreStates: [],
            };
            expect(summarizeCard(card)).toEqual({ date: TODAY, coreDone: 0, coreTotal: 0 });
      });
});

describe("rollingConsistency", () => {
      it("reports zero for empty history without breaking", () => {
            const result = rollingConsistency([], TODAY);
            expect(result.daysLogged).toBe(0);
            expect(result.windowDays).toBe(30);
            expect(result.percentage).toBe(0);
            expect(result.windowStart).toBe("2026-07-08");
            expect(result.windowEnd).toBe(TODAY);
      });

      it("counts a single card", () => {
            const result = rollingConsistency([TODAY], TODAY);
            expect(result.daysLogged).toBe(1);
            expect(result.percentage).toBe(3); // 1/30 = 3.33% -> 3
      });

      it("includes a card exactly at the far edge of the window", () => {
            // The window is 30 days inclusive of today, so the oldest day it can
            // contain is 29 days back.
            expect(rollingConsistency([daysAgo(29)], TODAY).daysLogged).toBe(1);
      });

      it("excludes a card exactly 30 days old", () => {
            expect(rollingConsistency([daysAgo(30)], TODAY).daysLogged).toBe(0);
            expect(rollingConsistency([daysAgo(31)], TODAY).daysLogged).toBe(0);
      });

      it("counts duplicate dates once", () => {
            expect(rollingConsistency([TODAY, TODAY, TODAY], TODAY).daysLogged).toBe(1);
      });

      it("ignores future-dated cards", () => {
            expect(rollingConsistency([addDays(TODAY, 1)], TODAY).daysLogged).toBe(0);
      });

      it("saturates at the window size", () => {
            const everyDay = daysEndingAt(TODAY, 30);
            const result = rollingConsistency(everyDay, TODAY);
            expect(result.daysLogged).toBe(30);
            expect(result.percentage).toBe(100);
      });

      it("never drops by more than 1 when a day passes without logging", () => {
            // The property a consecutive-day count cannot offer: a miss costs at
            // most one day, it cannot collapse the number to zero.
            const history = [daysAgo(0), daysAgo(1), daysAgo(2), daysAgo(29)];
            const before = rollingConsistency(history, TODAY).daysLogged;
            const afterMissedDay = rollingConsistency(history, addDays(TODAY, 1)).daysLogged;
            expect(before - afterMissedDay).toBeLessThanOrEqual(1);
            expect(afterMissedDay).toBeGreaterThan(0);
      });

      it("still reports a true rate after a long gap", () => {
            // 25 of the last 30 days logged, then five missed. A consecutive-day
            // count would read zero here; consistency reads what actually happened.
            const logged = daysEndingAt(daysAgo(5), 25);
            expect(rollingConsistency(logged, TODAY).daysLogged).toBe(25);
      });
});

describe("heatmapLevel", () => {
      it("renders a missing day at the neutral level", () => {
            expect(heatmapLevel(false, 0, 3)).toBe(0);
            // Never distinguishes a miss by anything else, whatever counts arrive.
            expect(heatmapLevel(false, 3, 3)).toBe(0);
      });

      it("renders a logged day with no core done above neutral", () => {
            // Logging is itself an action and has to register visually.
            expect(heatmapLevel(true, 0, 3)).toBe(1);
      });

      it("steps with the fraction of core items completed", () => {
            expect(heatmapLevel(true, 1, 3)).toBe(2); // 1/3
            expect(heatmapLevel(true, 2, 3)).toBe(3); // 2/3
            expect(heatmapLevel(true, 3, 3)).toBe(4); // 3/3
      });

      it("works for a two-item spine", () => {
            expect(heatmapLevel(true, 0, 2)).toBe(1);
            expect(heatmapLevel(true, 1, 2)).toBe(3); // half
            expect(heatmapLevel(true, 2, 2)).toBe(4);
      });

      it("treats a card with no core items as logged", () => {
            expect(heatmapLevel(true, 0, 0)).toBe(1);
      });
});

describe("buildHeatmap", () => {
      const cards = [
            { date: daysAgo(0), coreDone: 3, coreTotal: 3 },
            { date: daysAgo(2), coreDone: 0, coreTotal: 3 },
      ];

      it("emits one cell per day in the window, in order", () => {
            const cells = buildHeatmap(cards, recentWindow(TODAY, 4));
            expect(cells.map((cell) => cell.date)).toEqual([
                  daysAgo(3),
                  daysAgo(2),
                  daysAgo(1),
                  daysAgo(0),
            ]);
      });

      it("marks days without a card as absent at level 0", () => {
            const cells = buildHeatmap(cards, recentWindow(TODAY, 4));
            const [threeAgo, twoAgo, oneAgo, todayCell] = cells;

            expect(threeAgo).toMatchObject({ hasCard: false, level: 0, coreDone: 0, coreTotal: 0 });
            expect(twoAgo).toMatchObject({ hasCard: true, level: 1 });
            expect(oneAgo).toMatchObject({ hasCard: false, level: 0 });
            expect(todayCell).toMatchObject({ hasCard: true, level: 4 });
      });

      it("produces an all-neutral grid for empty history", () => {
            const cells = buildHeatmap([], recentWindow(TODAY));
            expect(cells).toHaveLength(21);
            expect(cells.every((cell) => cell.level === 0 && !cell.hasCard)).toBe(true);
      });
});

describe("heatmap windows", () => {
      it("defaults to the most recent 21 days, ending today", () => {
            const window = recentWindow(TODAY);
            expect(window).toHaveLength(21);
            expect(window.at(-1)).toBe(TODAY);
            expect(window[0]).toBe(daysAgo(20));
      });

      it("spans earliest card through today for all-time", () => {
            const window = allTimeWindow([daysAgo(40), daysAgo(2)], TODAY);
            expect(window[0]).toBe(daysAgo(40));
            expect(window.at(-1)).toBe(TODAY);
            expect(window).toHaveLength(41);
      });

      it("degenerates to today with no history", () => {
            expect(allTimeWindow([], TODAY)).toEqual([TODAY]);
      });

      it("never runs backwards if a card is dated ahead of today", () => {
            expect(allTimeWindow([addDays(TODAY, 3)], TODAY)).toEqual([TODAY]);
      });
});

describe("backfill eligibility", () => {
      it("allows today", () => {
            expect(editabilityOf(TODAY, TODAY)).toBe("editable");
            expect(canEditCard(TODAY, TODAY)).toBe(true);
      });

      it("allows the three preceding days", () => {
            expect(editabilityOf(daysAgo(1), TODAY)).toBe("editable");
            expect(editabilityOf(daysAgo(2), TODAY)).toBe("editable");
            expect(editabilityOf(daysAgo(3), TODAY)).toBe("editable");
      });

      it("locks the day exactly past the boundary", () => {
            expect(editabilityOf(daysAgo(4), TODAY)).toBe("read-only");
            expect(canEditCard(daysAgo(4), TODAY)).toBe(false);
            expect(editabilityOf(daysAgo(90), TODAY)).toBe("read-only");
      });

      it("refuses future days", () => {
            expect(editabilityOf(addDays(TODAY, 1), TODAY)).toBe("future");
            expect(canEditCard(addDays(TODAY, 1), TODAY)).toBe(false);
      });

      it("holds across a month boundary", () => {
            const firstOfMonth = "2026-09-01";
            expect(editabilityOf("2026-08-29", firstOfMonth)).toBe("editable"); // 3 days
            expect(editabilityOf("2026-08-28", firstOfMonth)).toBe("read-only"); // 4 days
      });
});

describe("emptyBackfillDays", () => {
      it("lists backfillable days that have no card, oldest first", () => {
            expect(emptyBackfillDays([daysAgo(2)], TODAY)).toEqual([daysAgo(3), daysAgo(1)]);
      });

      it("never includes today", () => {
            expect(emptyBackfillDays([], TODAY)).toEqual([daysAgo(3), daysAgo(2), daysAgo(1)]);
      });

      it("is empty when the window is filled", () => {
            expect(
                  emptyBackfillDays([daysAgo(1), daysAgo(2), daysAgo(3)], TODAY),
            ).toEqual([]);
      });

      it("ignores cards outside the window", () => {
            expect(emptyBackfillDays([daysAgo(10)], TODAY)).toHaveLength(3);
      });
});

describe("pageMode", () => {
      it("shows only an empty card when there is no history at all", () => {
            expect(pageMode(null, TODAY)).toBe("re-entry");
      });

      it("shows the full page while the gap is within the threshold", () => {
            expect(pageMode(TODAY, TODAY)).toBe("full");
            expect(pageMode(daysAgo(1), TODAY)).toBe("full");
            expect(pageMode(daysAgo(5), TODAY)).toBe("full"); // exactly at the threshold
      });

      it("drops to re-entry once the gap exceeds the threshold", () => {
            expect(pageMode(daysAgo(6), TODAY)).toBe("re-entry"); // first day past it
            expect(pageMode(daysAgo(14), TODAY)).toBe("re-entry");
            expect(pageMode(daysAgo(365), TODAY)).toBe("re-entry");
      });

      it("returns to the full page once today is logged", () => {
            // The gap after saving today's card is 0, whatever came before.
            expect(pageMode(TODAY, TODAY)).toBe("full");
      });

      it("does not hide the page for a future-dated card", () => {
            expect(pageMode(addDays(TODAY, 2), TODAY)).toBe("full");
      });
});

describe("mostRecentCardDate", () => {
      it("returns null for empty history", () => {
            expect(mostRecentCardDate([])).toBeNull();
      });

      it("finds the latest date regardless of input order", () => {
            expect(mostRecentCardDate([daysAgo(9), daysAgo(1), daysAgo(30)])).toBe(daysAgo(1));
      });

      it("handles a single card", () => {
            expect(mostRecentCardDate([daysAgo(12)])).toBe(daysAgo(12));
      });
});
