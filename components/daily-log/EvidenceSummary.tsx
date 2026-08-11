"use client";

import {
      compareCalendarDates,
      differenceInDays,
      formatCalendarDate,
      type CalendarDate,
} from "@/lib/daily-log/date";
import type { CardCoreProgress } from "@/lib/daily-log/types";

import { FieldLabel, Panel } from "./primitives";

interface EvidenceSummaryProps {
      summaries: CardCoreProgress[];
      /** Backfillable days with no card yet, oldest first. */
      emptyBackfillDays: CalendarDate[];
      today: CalendarDate;
      onSelectDay: (date: CalendarDate) => void;
}

/**
 * The pile, counted. Cards written all time and the day the log starts.
 *
 * Every number here only ever goes up — a total and a start date can't be
 * spent, so unlike a streak there is nothing in this tile a bad week can take
 * away. It also carries the backfill offer, which is the one place on the page
 * that mentions an empty day at all.
 */
export function EvidenceSummary({
      summaries,
      emptyBackfillDays,
      today,
      onSelectDay,
}: EvidenceSummaryProps) {
      const first = earliestDate(summaries);

      return (
            <Panel className="justify-between gap-5">
                  <FieldLabel>Evidence</FieldLabel>

                  <div>
                        <div className="flex items-baseline gap-2 tabular-nums">
                              <span className="text-[44px] font-semibold leading-none text-white">
                                    {summaries.length}
                              </span>
                              <span className="text-lg leading-none text-zinc-600">
                                    {summaries.length === 1 ? "card" : "cards"}
                              </span>
                        </div>
                        <p className="mt-2.5 text-[13px] text-zinc-500">
                              {first
                                    ? `written since ${formatCalendarDate(first, {
                                            day: "numeric",
                                            month: "long",
                                      })}`
                                    : "today would be the first"}
                        </p>
                  </div>

                  {emptyBackfillDays.length > 0 && (
                        <BackfillPrompt
                              days={emptyBackfillDays}
                              today={today}
                              onSelectDay={onSelectDay}
                        />
                  )}
            </Panel>
      );
}

/**
 * Plain statement that a fillable day is empty, in ordinary text colour.
 * Not a warning, not a count of what was missed — an offer.
 */
function BackfillPrompt({
      days,
      today,
      onSelectDay,
}: {
      days: CalendarDate[];
      today: CalendarDate;
      onSelectDay: (date: CalendarDate) => void;
}) {
      // Nearest empty day: "yesterday" is the one worth naming.
      const nearest = days[days.length - 1];

      return (
            <p className="border-t border-white/[0.07] pt-4 text-[13px] text-zinc-500">
                  {describeGap(nearest, today)} is still empty —{" "}
                  <button
                        type="button"
                        onClick={() => onSelectDay(nearest)}
                        className="text-zinc-300 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-white hover:decoration-zinc-400"
                  >
                        add it
                  </button>
                  .
            </p>
      );
}

function describeGap(date: CalendarDate, today: CalendarDate): string {
      if (differenceInDays(today, date) === 1) return "Yesterday";
      return formatCalendarDate(date, { weekday: "long" });
}

function earliestDate(summaries: CardCoreProgress[]): CalendarDate | null {
      if (summaries.length === 0) return null;
      return summaries.reduce(
            (min, summary) =>
                  compareCalendarDates(summary.date, min) < 0 ? summary.date : min,
            summaries[0].date,
      );
}
