"use client";

import { useMemo, useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
      Tooltip,
      TooltipContent,
      TooltipProvider,
      TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
      formatCalendarDate,
      weekdayIndex,
      type CalendarDate,
} from "@/lib/daily-log/date";
import {
      allTimeWindow,
      buildHeatmap,
      recentWindow,
      type HeatmapLevel,
} from "@/lib/daily-log/domain";
import type { CardCoreProgress } from "@/lib/daily-log/types";

import { FieldLabel, Panel } from "./primitives";

/**
 * Level -> tint. The only colours in this feature's history view.
 *
 * Level 0 is a neutral gray, identical to the grid's own background weight:
 * a day without a card is missing data, not a failed day. There is deliberately
 * no red, no amber, no border treatment and no strikethrough anywhere in this
 * map — a miss must never be able to look like a verdict.
 */
const LEVEL_STYLES: Record<HeatmapLevel, string> = {
      0: "bg-white/[0.04]",
      1: "bg-indigo-500/25",
      2: "bg-indigo-500/45",
      3: "bg-indigo-500/70",
      4: "bg-indigo-400",
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

interface EvidenceHeatmapProps {
      summaries: CardCoreProgress[];
      today: CalendarDate;
      onSelectDay: (date: CalendarDate) => void;
}

export function EvidenceHeatmap({
      summaries,
      today,
      onSelectDay,
}: EvidenceHeatmapProps) {
      const [scope, setScope] = useState<"recent" | "all">("recent");

      const cells = useMemo(() => {
            const window =
                  scope === "recent"
                        ? recentWindow(today)
                        : allTimeWindow(
                                summaries.map((summary) => summary.date),
                                today,
                          );
            return buildHeatmap(summaries, window);
      }, [scope, summaries, today]);

      // Pad the first row so columns line up under their weekday.
      const leadingBlanks = cells.length > 0 ? weekdayIndex(cells[0].date) : 0;

      return (
            <Panel className="gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                        <FieldLabel>The record</FieldLabel>
                        <Tabs
                              value={scope}
                              onValueChange={(value) => setScope(value as "recent" | "all")}
                        >
                              <TabsList className="h-8 rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5">
                                    <TabsTrigger
                                          value="recent"
                                          className="rounded-md px-3 text-[12px] text-zinc-500 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                                    >
                                          21 days
                                    </TabsTrigger>
                                    <TabsTrigger
                                          value="all"
                                          className="rounded-md px-3 text-[12px] text-zinc-500 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                                    >
                                          All time
                                    </TabsTrigger>
                              </TabsList>
                        </Tabs>
                  </div>

                  {/*
                   * Capped and centred: a wide tile would otherwise inflate the cells
                   * into buttons. All-time can run to many weeks, so the calendar
                   * scrolls inside the tile instead of stretching the whole grid row.
                   */}
                  <div className="mx-auto w-full max-w-[23rem]">
                        <div className="grid grid-cols-7 gap-1.5 pb-1.5">
                              {WEEKDAYS.map((day, index) => (
                                    <span
                                          key={`${day}-${index}`}
                                          className="text-center text-[10px] font-medium text-zinc-700"
                                    >
                                          {day}
                                    </span>
                              ))}
                        </div>

                        <TooltipProvider delayDuration={120}>
                              <div className="grid max-h-[19rem] grid-cols-7 gap-1.5 overflow-y-auto">
                                    {Array.from({ length: leadingBlanks }, (_, index) => (
                                          <div key={`blank-${index}`} aria-hidden />
                                    ))}

                                    {cells.map((cell) => {
                                          const description = describeCell(
                                                cell.date,
                                                cell.hasCard,
                                                cell.coreDone,
                                                cell.coreTotal,
                                          );
                                          return (
                                                <Tooltip key={cell.date}>
                                                      <TooltipTrigger asChild>
                                                            <button
                                                                  type="button"
                                                                  onClick={() => onSelectDay(cell.date)}
                                                                  aria-label={description}
                                                                  className={cn(
                                                                        "aspect-square w-full rounded-[5px] transition-all duration-150",
                                                                        "hover:scale-[1.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
                                                                        LEVEL_STYLES[cell.level],
                                                                        cell.date === today &&
                                                                              "ring-1 ring-white/50",
                                                                  )}
                                                            />
                                                      </TooltipTrigger>
                                                      <TooltipContent
                                                            sideOffset={6}
                                                            className="border-white/10 bg-zinc-900 text-[12px] text-zinc-200"
                                                      >
                                                            {description}
                                                      </TooltipContent>
                                                </Tooltip>
                                          );
                                    })}
                              </div>
                        </TooltipProvider>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
                        {summaries.length === 0 ? (
                              // Says what is true without characterising it.
                              <p className="text-[12px] text-zinc-600">
                                    Nothing logged yet — today would be the first.
                              </p>
                        ) : (
                              <span />
                        )}

                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                              <span className="mr-0.5">Less</span>
                              {([0, 1, 2, 3, 4] as HeatmapLevel[]).map((level) => (
                                    <span
                                          key={level}
                                          className={cn("size-2.5 rounded-[3px]", LEVEL_STYLES[level])}
                                    />
                              ))}
                              <span className="ml-0.5">More</span>
                        </div>
                  </div>
            </Panel>
      );
}

/** Plain description, for the tooltip and for screen readers. */
function describeCell(
      date: CalendarDate,
      hasCard: boolean,
      coreDone: number,
      coreTotal: number,
): string {
      const readable = formatCalendarDate(date, {
            weekday: "short",
            day: "numeric",
            month: "short",
      });

      // Nothing here characterises the absence; it simply states it.
      if (!hasCard) return `${readable} — no card`;
      if (coreTotal === 0) return `${readable} — logged`;
      return `${readable} — logged, ${coreDone}/${coreTotal} core`;
}
