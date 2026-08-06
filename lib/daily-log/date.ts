/**
 * The one date module for the Daily Evidence Log.
 *
 * Every "what is today", day-boundary and window calculation in this feature
 * goes through here. Nothing else in the feature may call `new Date()` to
 * decide what day it is.
 *
 * Two representations, and only two:
 *
 * - `CalendarDate` — a `"YYYY-MM-DD"` string. This is the domain currency: a
 *   day on a wall calendar, with no time and no offset. All rules (rolling
 *   window, backfill, re-entry, heatmap) operate on these.
 * - `Date` at UTC midnight — the wire format for Postgres `DATE` columns.
 *   Prisma hands back `@db.Date` values as UTC midnight, so the boundary
 *   converts with UTC getters *only*. Reading one with `getDate()` instead of
 *   `getUTCDate()` silently shifts the day for anyone west of UTC; that is the
 *   classic daily-log bug and the reason those getters are confined to this file.
 *
 * "Today" is resolved in a fixed IANA zone rather than the server's or the
 * browser's, so a card saved at 00:30 lands on the day the user actually lived,
 * and the server can validate backfill without trusting the client.
 */

/** Wall-calendar day, `"YYYY-MM-DD"`. Never carries a time or an offset. */
export type CalendarDate = string;

/**
 * Day boundaries are resolved in this zone everywhere — server and client.
 * India observes no DST, but nothing here assumes that: all arithmetic runs in
 * UTC, which has no offset transitions to trip over.
 */
export const APP_TIMEZONE = "Asia/Kolkata";

const MS_PER_DAY = 86_400_000;
const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * True for a real day on the calendar. Rejects the shapes a regex alone lets
 * through — `2026-02-30`, `2026-13-01` — by round-tripping through UTC.
 */
export function isCalendarDate(value: string): boolean {
      if (!CALENDAR_DATE_PATTERN.test(value)) return false;

      const [year, month, day] = value.split("-").map(Number);
      const utc = Date.UTC(year, month - 1, day);
      if (Number.isNaN(utc)) return false;

      // Date.UTC rolls overflow forward (Feb 30 -> Mar 2), so a genuine date is
      // the one that survives the round trip unchanged.
      const roundTrip = new Date(utc);
      return (
            roundTrip.getUTCFullYear() === year &&
            roundTrip.getUTCMonth() === month - 1 &&
            roundTrip.getUTCDate() === day
      );
}

/** Narrowing parse for untrusted input. Throws rather than guessing. */
export function assertCalendarDate(value: string): CalendarDate {
      if (!isCalendarDate(value)) {
            throw new Error(`Invalid calendar date: ${value}`);
      }
      return value;
}

/**
 * The calendar day a given instant falls on, in `timeZone`.
 *
 * Built from `Intl.DateTimeFormat` parts rather than a locale format string:
 * `en-CA` happens to render ISO-like output today, but relying on that is
 * relying on CLDR data staying put. Parts are contractual.
 */
export function toCalendarDateInTimeZone(
      instant: Date,
      timeZone: string = APP_TIMEZONE,
): CalendarDate {
      const parts = new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
      }).formatToParts(instant);

      const lookup = (type: "year" | "month" | "day") =>
            parts.find((part) => part.type === type)?.value ?? "";

      return `${lookup("year")}-${lookup("month")}-${lookup("day")}`;
}

/** Today, in the app's zone. The only sanctioned reading of the clock. */
export function today(
      now: Date = new Date(),
      timeZone: string = APP_TIMEZONE,
): CalendarDate {
      return toCalendarDateInTimeZone(now, timeZone);
}

/** `CalendarDate` -> UTC-midnight `Date`, for writing a Postgres `DATE`. */
export function toUtcDate(date: CalendarDate): Date {
      const [year, month, day] = assertCalendarDate(date).split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, day));
}

/**
 * UTC-midnight `Date` -> `CalendarDate`, for reading a Postgres `DATE`.
 * UTC getters are mandatory here; local getters would shift the day.
 */
export function fromUtcDate(value: Date): CalendarDate {
      const year = String(value.getUTCFullYear()).padStart(4, "0");
      const month = String(value.getUTCMonth() + 1).padStart(2, "0");
      const day = String(value.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
}

/** Shift by whole days. Negative goes backwards. */
export function addDays(date: CalendarDate, delta: number): CalendarDate {
      const shifted = new Date(toUtcDate(date).getTime() + delta * MS_PER_DAY);
      return fromUtcDate(shifted);
}

/**
 * Whole days from `from` to `to`; positive when `to` is later.
 * Exact at any offset because both operands are UTC midnights, so no DST
 * transition can land inside the subtraction.
 */
export function differenceInDays(to: CalendarDate, from: CalendarDate): number {
      return Math.round(
            (toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MS_PER_DAY,
      );
}

/** `-1 | 0 | 1`, suitable for `Array.prototype.sort`. Lexicographic works on this format. */
export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
      return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * The `length` days ending at `end`, inclusive, oldest first.
 * `daysEndingAt("2026-08-06", 3)` -> `["2026-08-04", "2026-08-05", "2026-08-06"]`.
 */
export function daysEndingAt(end: CalendarDate, length: number): CalendarDate[] {
      if (length <= 0) return [];
      return Array.from({ length }, (_, index) => addDays(end, index - (length - 1)));
}

/** Every day from `start` to `end` inclusive, oldest first. Empty if inverted. */
export function daysBetween(start: CalendarDate, end: CalendarDate): CalendarDate[] {
      const span = differenceInDays(end, start);
      if (span < 0) return [];
      return Array.from({ length: span + 1 }, (_, index) => addDays(start, index));
}
