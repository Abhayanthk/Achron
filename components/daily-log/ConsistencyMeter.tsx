"use client";

import type { RollingConsistency } from "@/lib/daily-log/domain";

import { FieldLabel, Panel, RateBar } from "./primitives";

/**
 * The one headline metric: days logged in the last 30.
 *
 * A rate, not a score. It cannot be lost, cannot go negative, and moves by at
 * most one per day — so it stays true after a gap instead of reading zero.
 * Given its own tile now that the page is a grid, but still stated flatly: a
 * count and a bar, no target line, no colour that changes with the value.
 */
export function ConsistencyMeter({
      consistency,
}: {
      consistency: RollingConsistency;
}) {
      return (
            <Panel className="justify-between gap-5">
                  <FieldLabel>Consistency</FieldLabel>

                  <div>
                        <div className="flex items-baseline gap-1.5 tabular-nums">
                              <span className="text-[44px] font-semibold leading-none text-white">
                                    {consistency.daysLogged}
                              </span>
                              <span className="text-lg leading-none text-zinc-600">
                                    / {consistency.windowDays}
                              </span>
                        </div>
                        <p className="mt-2.5 text-[13px] text-zinc-500">
                              days logged in the last {consistency.windowDays}
                        </p>
                  </div>

                  <RateBar percentage={consistency.percentage} />
            </Panel>
      );
}
