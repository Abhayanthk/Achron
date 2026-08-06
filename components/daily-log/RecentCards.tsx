"use client";

import { Check } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCalendarDate, type CalendarDate } from "@/lib/daily-log/date";
import type { DailyCardRecord } from "@/lib/daily-log/types";

import { FieldLabel, Panel } from "./primitives";

interface RecentCardsProps {
      cards: DailyCardRecord[];
      today: CalendarDate;
      onSelectDay: (date: CalendarDate) => void;
}

/** Reverse-chronological, condensed. The evidence, in the user's own words. */
export function RecentCards({ cards, today, onSelectDay }: RecentCardsProps) {
      if (cards.length === 0) return null;

      return (
            <Panel>
                  <FieldLabel>Recent cards</FieldLabel>

                  <ScrollArea className="mt-4 max-h-[30rem] pr-3">
                        <ol className="space-y-2">
                              {cards.map((card) => {
                                    const doneStates = card.coreStates.filter((state) => state.done);
                                    return (
                                          <li key={card.id}>
                                                <button
                                                      type="button"
                                                      onClick={() => onSelectDay(card.date)}
                                                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 text-left transition-colors hover:border-white/12 hover:bg-white/[0.04]"
                                                >
                                                      <div className="mb-2.5 flex items-center justify-between gap-3">
                                                            <span className="text-[12px] font-medium text-zinc-400">
                                                                  {formatCalendarDate(card.date, {
                                                                        weekday: "long",
                                                                        day: "numeric",
                                                                        month: "long",
                                                                  })}
                                                                  {card.date === today && (
                                                                        <span className="ml-2 text-indigo-400">
                                                                              today
                                                                        </span>
                                                                  )}
                                                            </span>
                                                            {card.coreStates.length > 0 && (
                                                                  <span className="text-[11px] tabular-nums text-zinc-600">
                                                                        {doneStates.length}/{card.coreStates.length}
                                                                  </span>
                                                            )}
                                                      </div>

                                                      <ul className="space-y-1">
                                                            {card.did.map((bullet, index) => (
                                                                  <li
                                                                        key={index}
                                                                        className="flex gap-2.5 text-[14px] leading-relaxed text-zinc-200"
                                                                  >
                                                                        <span className="select-none text-zinc-700">
                                                                              —
                                                                        </span>
                                                                        <span className="line-clamp-2">{bullet}</span>
                                                                  </li>
                                                            ))}
                                                      </ul>

                                                      {doneStates.length > 0 && (
                                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                                  {doneStates.map((state) => (
                                                                        <span
                                                                              key={state.coreItemId}
                                                                              className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-300"
                                                                        >
                                                                              <Check className="size-3" />
                                                                              {state.labelSnapshot}
                                                                        </span>
                                                                  ))}
                                                            </div>
                                                      )}

                                                      {card.avoided && (
                                                            <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[12px] text-zinc-500">
                                                                  <span className="text-zinc-600">Avoided </span>
                                                                  {card.avoided}
                                                            </p>
                                                      )}
                                                </button>
                                          </li>
                                    );
                              })}
                        </ol>
                  </ScrollArea>
            </Panel>
      );
}
