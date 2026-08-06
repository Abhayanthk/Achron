"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
      differenceInDays,
      formatCalendarDate,
      type CalendarDate,
} from "@/lib/daily-log/date";
import type { DailyLogPageData } from "@/lib/daily-log/types";

import { CardEditor } from "./CardEditor";
import { ConsistencyMeter } from "./ConsistencyMeter";
import { CoreItemsDialog } from "./CoreItemsDialog";
import { DayDialog } from "./DayDialog";
import { EvidenceHeatmap } from "./EvidenceHeatmap";
import { Panel } from "./primitives";
import { RecentCards } from "./RecentCards";
import { DAILY_LOG_QUERY_KEY } from "./use-save-card";

/** Staggered on load: the card settles first, history follows. */
const reveal = {
      hidden: { opacity: 0, y: 8 },
      show: (index: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                  duration: 0.32,
                  delay: index * 0.06,
                  ease: [0.22, 1, 0.36, 1] as const,
            },
      }),
};

export function DailyLogClient() {
      const [selectedDay, setSelectedDay] = useState<CalendarDate | null>(null);
      const [coreItemsOpen, setCoreItemsOpen] = useState(false);

      const { data, isLoading, isError, refetch } = useQuery({
            queryKey: DAILY_LOG_QUERY_KEY,
            queryFn: async () => {
                  const { data } = await axios.get<DailyLogPageData>("/api/daily-log");
                  return data;
            },
      });

      if (isLoading) return <LoadingState />;

      if (isError || !data) {
            return (
                  <Shell>
                        <Panel className="space-y-4 text-center">
                              <p className="text-sm text-zinc-400">Could not load your log.</p>
                              <Button
                                    variant="outline"
                                    onClick={() => void refetch()}
                                    className="border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white"
                              >
                                    Try again
                              </Button>
                        </Panel>
                  </Shell>
            );
      }

      const editor = (
            <CardEditor
                  key={data.today}
                  date={data.today}
                  card={data.todayCard}
                  coreItems={data.coreItems}
                  onManageCore={() => setCoreItemsOpen(true)}
                  autoFocus={data.mode === "re-entry"}
            />
      );

      const dateLine = formatCalendarDate(data.today, {
            weekday: "long",
            day: "numeric",
            month: "long",
      });

      /**
       * Re-entry: today's empty card and nothing else.
       *
       * The server has already withheld the history, so there is nothing here to
       * accidentally render — no heatmap, no metric, no mention of how long it has
       * been. The first thing seen on returning is a box to fill, not a gap.
       */
      if (data.mode === "re-entry") {
            return (
                  <Shell narrow>
                        <motion.div initial="hidden" animate="show" custom={0} variants={reveal}>
                              <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-600">
                                    {dateLine}
                              </p>
                              <Panel>{editor}</Panel>
                        </motion.div>
                        <CoreItemsDialog open={coreItemsOpen} onOpenChange={setCoreItemsOpen} />
                  </Shell>
            );
      }

      return (
            <Shell>
                  <motion.header
                        initial="hidden"
                        animate="show"
                        custom={0}
                        variants={reveal}
                        className="mb-8 flex flex-wrap items-end justify-between gap-6"
                  >
                        <div>
                              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-600">
                                    {dateLine}
                              </p>
                              <h1 className="mt-1.5 text-[27px] font-semibold tracking-tight text-white">
                                    Evidence Log
                              </h1>
                        </div>

                        <div className="flex items-end gap-6">
                              {data.consistency && (
                                    <ConsistencyMeter consistency={data.consistency} />
                              )}
                              <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCoreItemsOpen(true)}
                                    className="h-9 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                              >
                                    <Settings2 className="mr-2 size-4" />
                                    Core
                              </Button>
                        </div>
                  </motion.header>

                  <div className="space-y-5">
                        <motion.div initial="hidden" animate="show" custom={1} variants={reveal}>
                              <Panel>
                                    {editor}
                                    {data.emptyBackfillDays.length > 0 && (
                                          <BackfillPrompt
                                                days={data.emptyBackfillDays}
                                                today={data.today}
                                                onSelectDay={setSelectedDay}
                                          />
                                    )}
                              </Panel>
                        </motion.div>

                        <motion.div initial="hidden" animate="show" custom={2} variants={reveal}>
                              <EvidenceHeatmap
                                    summaries={data.cardSummaries}
                                    today={data.today}
                                    onSelectDay={setSelectedDay}
                              />
                        </motion.div>

                        {data.recentCards.length > 0 && (
                              <motion.div
                                    initial="hidden"
                                    animate="show"
                                    custom={3}
                                    variants={reveal}
                              >
                                    <RecentCards
                                          cards={data.recentCards}
                                          today={data.today}
                                          onSelectDay={setSelectedDay}
                                    />
                              </motion.div>
                        )}
                  </div>

                  <DayDialog
                        date={selectedDay}
                        coreItems={data.coreItems}
                        onOpenChange={(open) => !open && setSelectedDay(null)}
                  />
                  <CoreItemsDialog open={coreItemsOpen} onOpenChange={setCoreItemsOpen} />
            </Shell>
      );
}

/** Page frame: a single centred column with a faint wash behind it. */
function Shell({
      children,
      narrow = false,
}: {
      children: ReactNode;
      narrow?: boolean;
}) {
      return (
            <div className="relative min-h-full">
                  <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(99,102,241,0.06),transparent)]"
                  />
                  <div
                        className={`relative mx-auto w-full px-5 py-10 sm:py-14 ${
                              narrow ? "max-w-xl" : "max-w-2xl"
                        }`}
                  >
                        {children}
                  </div>
            </div>
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
            <p className="mt-7 border-t border-white/[0.07] pt-5 text-[13px] text-zinc-500">
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

function LoadingState() {
      return (
            <Shell>
                  <div className="mb-8 space-y-2">
                        <Skeleton className="h-3 w-40 bg-white/5" />
                        <Skeleton className="h-7 w-52 bg-white/5" />
                  </div>
                  <div className="space-y-5">
                        <Skeleton className="h-80 w-full rounded-2xl bg-white/5" />
                        <Skeleton className="h-56 w-full rounded-2xl bg-white/5" />
                  </div>
            </Shell>
      );
}
