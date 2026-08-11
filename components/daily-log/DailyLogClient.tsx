"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCalendarDate, type CalendarDate } from "@/lib/daily-log/date";
import type { DailyLogPageData } from "@/lib/daily-log/types";

import { CardEditor } from "./CardEditor";
import { ConsistencyMeter } from "./ConsistencyMeter";
import { CoreItemsDialog } from "./CoreItemsDialog";
import { CoreLately } from "./CoreLately";
import { DayDialog } from "./DayDialog";
import { EvidenceHeatmap } from "./EvidenceHeatmap";
import { EvidenceSummary } from "./EvidenceSummary";
import { Panel } from "./primitives";
import { RecentCards } from "./RecentCards";
import { DAILY_LOG_QUERY_KEY } from "./use-save-card";

/** Staggered on load: the card settles first, the record follows. */
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
                  <Shell narrow>
                        <Panel className="items-center gap-4 text-center">
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
       * been. The first thing seen on returning is a box to fill, not a gap. It
       * stays a single narrow column on purpose: the grid is the page that shows a
       * record, and on this day there is deliberately no record on screen.
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
                        className="mb-5 flex flex-wrap items-end justify-between gap-4"
                  >
                        <div>
                              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-600">
                                    {dateLine}
                              </p>
                              <h1 className="mt-1.5 text-[27px] font-semibold tracking-tight text-white">
                                    Evidence Log
                              </h1>
                        </div>

                        <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCoreItemsOpen(true)}
                              className="h-9 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                        >
                              <Settings2 className="mr-2 size-4" />
                              Core
                        </Button>
                  </motion.header>

                  {/*
                   * Bento: today's card holds the tall left block and everything that
                   * looks backwards fills the space beside and beneath it. Writing
                   * stays the largest thing on the page at every breakpoint — the
                   * grid gives the history more room, never more weight.
                   */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
                        <Tile index={1} className="md:col-span-6 xl:col-span-5 xl:row-span-2">
                              <Panel>{editor}</Panel>
                        </Tile>

                        {data.consistency && (
                              <Tile index={2} className="md:col-span-3 xl:col-span-3">
                                    <ConsistencyMeter consistency={data.consistency} />
                              </Tile>
                        )}

                        <Tile index={3} className="md:col-span-3 xl:col-span-4">
                              <EvidenceSummary
                                    summaries={data.cardSummaries}
                                    emptyBackfillDays={data.emptyBackfillDays}
                                    today={data.today}
                                    onSelectDay={setSelectedDay}
                              />
                        </Tile>

                        <Tile index={4} className="md:col-span-3 xl:col-span-4">
                              <EvidenceHeatmap
                                    summaries={data.cardSummaries}
                                    today={data.today}
                                    onSelectDay={setSelectedDay}
                              />
                        </Tile>

                        <Tile index={5} className="md:col-span-3 xl:col-span-3">
                              <CoreLately
                                    cards={data.recentCards}
                                    coreItems={data.coreItems}
                              />
                        </Tile>

                        {data.recentCards.length > 0 && (
                              <Tile index={6} className="md:col-span-6 xl:col-span-12">
                                    <RecentCards
                                          cards={data.recentCards}
                                          today={data.today}
                                          onSelectDay={setSelectedDay}
                                    />
                              </Tile>
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

/**
 * One cell of the bento. Carries the stagger and the span, and nothing else —
 * the tile's own component decides what it looks like inside.
 */
function Tile({
      index,
      className,
      children,
}: {
      index: number;
      className?: string;
      children: ReactNode;
}) {
      return (
            <motion.div
                  initial="hidden"
                  animate="show"
                  custom={index}
                  variants={reveal}
                  className={cn("min-w-0", className)}
            >
                  {children}
            </motion.div>
      );
}

/**
 * Page frame. Full-bleed by default so the grid can use the whole viewport;
 * `narrow` is the deliberate exception for the one-card views, where a wide
 * column would only stretch a single input across the screen.
 */
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
                        className={cn(
                              "relative w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8",
                              narrow && "mx-auto max-w-xl",
                        )}
                  >
                        {children}
                  </div>
            </div>
      );
}

function LoadingState() {
      return (
            <Shell>
                  <div className="mb-5 space-y-2">
                        <Skeleton className="h-3 w-40 bg-white/5" />
                        <Skeleton className="h-7 w-52 bg-white/5" />
                  </div>

                  {/* Same spans as the real grid, so nothing jumps when data lands. */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
                        <Skeleton className="h-[28rem] rounded-2xl bg-white/5 md:col-span-6 xl:col-span-5 xl:row-span-2" />
                        <Skeleton className="h-40 rounded-2xl bg-white/5 md:col-span-3 xl:col-span-3" />
                        <Skeleton className="h-40 rounded-2xl bg-white/5 md:col-span-3 xl:col-span-4" />
                        <Skeleton className="h-[17rem] rounded-2xl bg-white/5 md:col-span-3 xl:col-span-4" />
                        <Skeleton className="h-[17rem] rounded-2xl bg-white/5 md:col-span-3 xl:col-span-3" />
                        <Skeleton className="h-56 rounded-2xl bg-white/5 md:col-span-6 xl:col-span-12" />
                  </div>
            </Shell>
      );
}
