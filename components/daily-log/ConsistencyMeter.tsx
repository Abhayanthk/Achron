"use client";

import type { RollingConsistency } from "@/lib/daily-log/domain";

/**
 * The one headline metric: days logged in the last 30.
 *
 * A rate, not a score. It cannot be lost, cannot go negative, and moves by at
 * most one per day — so it stays true after a gap instead of reading zero.
 * Rendered quietly on purpose: the evidence below is the point, this is a
 * footnote to it.
 */
export function ConsistencyMeter({ consistency }: { consistency: RollingConsistency }) {
      return (
            <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1 tabular-nums">
                        <span className="text-2xl font-semibold leading-none text-white">
                              {consistency.daysLogged}
                        </span>
                        <span className="text-sm leading-none text-zinc-600">
                              / {consistency.windowDays}
                        </span>
                  </div>
                  <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-zinc-600">
                        days logged
                  </p>
            </div>
      );
}
