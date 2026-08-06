import { describe, expect, it } from "vitest";

import {
      addDays,
      APP_TIMEZONE,
      assertCalendarDate,
      compareCalendarDates,
      daysBetween,
      daysEndingAt,
      differenceInDays,
      fromUtcDate,
      isCalendarDate,
      toCalendarDateInTimeZone,
      today,
      toUtcDate,
} from "./date";

describe("isCalendarDate", () => {
      it("accepts a real day", () => {
            expect(isCalendarDate("2026-08-06")).toBe(true);
      });

      it("rejects days that pass the regex but do not exist", () => {
            // Date.UTC would silently roll these forward; the round-trip catches them.
            expect(isCalendarDate("2026-02-30")).toBe(false);
            expect(isCalendarDate("2026-13-01")).toBe(false);
            expect(isCalendarDate("2026-00-10")).toBe(false);
            expect(isCalendarDate("2026-04-31")).toBe(false);
      });

      it("rejects malformed shapes", () => {
            expect(isCalendarDate("2026-8-6")).toBe(false);
            expect(isCalendarDate("06-08-2026")).toBe(false);
            expect(isCalendarDate("2026-08-06T00:00:00Z")).toBe(false);
            expect(isCalendarDate("")).toBe(false);
      });

      it("handles leap years", () => {
            expect(isCalendarDate("2028-02-29")).toBe(true);
            expect(isCalendarDate("2026-02-29")).toBe(false);
            // 2100 is not a leap year despite being divisible by 4.
            expect(isCalendarDate("2100-02-29")).toBe(false);
      });

      it("throws on assert for invalid input", () => {
            expect(() => assertCalendarDate("2026-02-30")).toThrow();
            expect(assertCalendarDate("2026-02-28")).toBe("2026-02-28");
      });
});

describe("day boundaries", () => {
      it("resolves the day in the app timezone, not UTC", () => {
            // 18:29:59Z is 23:59:59 IST on the 6th — still the 6th.
            const beforeMidnight = new Date("2026-08-06T18:29:59.000Z");
            expect(toCalendarDateInTimeZone(beforeMidnight, APP_TIMEZONE)).toBe("2026-08-06");

            // One second later IST rolls over, while UTC is still on the 6th.
            const afterMidnight = new Date("2026-08-06T18:30:00.000Z");
            expect(toCalendarDateInTimeZone(afterMidnight, APP_TIMEZONE)).toBe("2026-08-07");
            expect(toCalendarDateInTimeZone(afterMidnight, "UTC")).toBe("2026-08-06");
      });

      it("resolves a late-evening UTC instant to the next IST day", () => {
            // The classic bug: logging at 04:00 IST must not land on the previous day.
            const earlyMorningIst = new Date("2026-08-05T22:30:00.000Z"); // 04:00 IST on the 6th
            expect(toCalendarDateInTimeZone(earlyMorningIst, APP_TIMEZONE)).toBe("2026-08-06");
      });

      it("is correct across a DST transition in a zone that observes one", () => {
            // US spring-forward 2026: 02:00 EST on 8 March becomes 03:00 EDT.
            const beforeShift = new Date("2026-03-08T06:59:00.000Z"); // 01:59 EST
            const afterShift = new Date("2026-03-08T07:01:00.000Z"); // 03:01 EDT
            expect(toCalendarDateInTimeZone(beforeShift, "America/New_York")).toBe("2026-03-08");
            expect(toCalendarDateInTimeZone(afterShift, "America/New_York")).toBe("2026-03-08");

            // And the midnight boundary still lands correctly on either side of it.
            const beforeMidnightEst = new Date("2026-03-08T04:59:00.000Z"); // 23:59 EST on the 7th
            expect(toCalendarDateInTimeZone(beforeMidnightEst, "America/New_York")).toBe("2026-03-07");
      });

      it("today() defaults to the app timezone", () => {
            const instant = new Date("2026-08-06T18:30:00.000Z");
            expect(today(instant)).toBe("2026-08-07");
            expect(today(instant, "UTC")).toBe("2026-08-06");
      });
});

describe("Postgres DATE boundary", () => {
      it("round-trips through UTC midnight", () => {
            const date = "2026-08-06";
            const utc = toUtcDate(date);
            expect(utc.toISOString()).toBe("2026-08-06T00:00:00.000Z");
            expect(fromUtcDate(utc)).toBe(date);
      });

      it("reads a UTC-midnight Date without shifting the day", () => {
            // What Prisma hands back for a @db.Date column.
            expect(fromUtcDate(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-01-01");
            expect(fromUtcDate(new Date(Date.UTC(2026, 11, 31)))).toBe("2026-12-31");
      });

      it("pads single-digit months and days", () => {
            expect(fromUtcDate(new Date(Date.UTC(2026, 8, 5)))).toBe("2026-09-05");
      });

      it("rejects an invalid date rather than writing a rolled-over day", () => {
            expect(() => toUtcDate("2026-02-30")).toThrow();
      });
});

describe("arithmetic", () => {
      it("adds and subtracts whole days", () => {
            expect(addDays("2026-08-06", 1)).toBe("2026-08-07");
            expect(addDays("2026-08-06", -1)).toBe("2026-08-05");
            expect(addDays("2026-08-06", 0)).toBe("2026-08-06");
      });

      it("crosses month, year and leap boundaries", () => {
            expect(addDays("2026-02-28", 1)).toBe("2026-03-01"); // 2026 is not a leap year
            expect(addDays("2028-02-28", 1)).toBe("2028-02-29"); // 2028 is
            expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
            expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
            expect(addDays("2026-08-06", -30)).toBe("2026-07-07");
      });

      it("measures whole days, signed", () => {
            expect(differenceInDays("2026-08-06", "2026-08-06")).toBe(0);
            expect(differenceInDays("2026-08-06", "2026-08-05")).toBe(1);
            expect(differenceInDays("2026-08-05", "2026-08-06")).toBe(-1);
            expect(differenceInDays("2026-08-06", "2026-07-07")).toBe(30);
      });

      it("is unaffected by DST because it works in UTC", () => {
            // Spanning the US spring-forward: a naive local-time subtraction
            // would give 0.958 days here and round to the wrong answer.
            expect(differenceInDays("2026-03-09", "2026-03-08")).toBe(1);
            expect(differenceInDays("2026-11-02", "2026-11-01")).toBe(1); // fall-back
            expect(differenceInDays("2026-03-15", "2026-03-01")).toBe(14);
      });

      it("compares dates", () => {
            expect(compareCalendarDates("2026-08-05", "2026-08-06")).toBe(-1);
            expect(compareCalendarDates("2026-08-06", "2026-08-06")).toBe(0);
            expect(compareCalendarDates("2026-08-07", "2026-08-06")).toBe(1);
      });
});

describe("windows", () => {
      it("builds the N days ending at a date, oldest first", () => {
            expect(daysEndingAt("2026-08-06", 3)).toEqual([
                  "2026-08-04",
                  "2026-08-05",
                  "2026-08-06",
            ]);
      });

      it("handles degenerate lengths", () => {
            expect(daysEndingAt("2026-08-06", 1)).toEqual(["2026-08-06"]);
            expect(daysEndingAt("2026-08-06", 0)).toEqual([]);
            expect(daysEndingAt("2026-08-06", -5)).toEqual([]);
      });

      it("produces exactly 30 days for the rolling window", () => {
            const window = daysEndingAt("2026-08-06", 30);
            expect(window).toHaveLength(30);
            expect(window[0]).toBe("2026-07-08");
            expect(window.at(-1)).toBe("2026-08-06");
      });

      it("builds an inclusive range between two dates", () => {
            expect(daysBetween("2026-08-04", "2026-08-06")).toEqual([
                  "2026-08-04",
                  "2026-08-05",
                  "2026-08-06",
            ]);
            expect(daysBetween("2026-08-06", "2026-08-06")).toEqual(["2026-08-06"]);
      });

      it("returns nothing for an inverted range", () => {
            expect(daysBetween("2026-08-06", "2026-08-04")).toEqual([]);
      });
});
