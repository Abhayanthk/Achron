"use client";

import { Check } from "lucide-react";

import { formatCalendarDate, type CalendarDate } from "@/lib/daily-log/date";
import type { DailyCardRecord } from "@/lib/daily-log/types";

import { FieldLabel, Panel } from "./primitives";

/**
 * Bullets shown before a card is summarised. Enough to recognise the day by,
 * few enough that one busy day can't tower over the rest of the row.
 */
const VISIBLE_BULLETS = 4;

interface RecentCardsProps {
      cards: DailyCardRecord[];
      today: CalendarDate;
      onSelectDay: (date: CalendarDate) => void;
}

/**
 * Reverse-chronological, condensed. The evidence, in the user's own words.
 *
 * Laid out across the full width rather than down a scrolling column: the whole
 * recent record is visible at once, which is the point of keeping it.
 */
export function RecentCards({ cards, today, onSelectDay }: RecentCardsProps) {
      if (cards.length === 0) return null;

      return (
            <Panel className="gap-4">
                  <div className="flex items-baseline justify-between gap-3">
                        <FieldLabel>Recent cards</FieldLabel>
                        <span className="text-[11px] tabular-nums text-zinc-600">
                              {cards.length}
                        </span>
                  </div>

                  <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {cards.map((card) => (
                              <li key={card.id}>
                                    <RecentCard
                                          card={card}
                                          today={today}
                                          onSelect={() => onSelectDay(card.date)}
                                    />
                              </li>
                        ))}
                  </ol>
            </Panel>
      );
}

function RecentCard({
      card,
      today,
      onSelect,
}: {
      card: DailyCardRecord;
      today: CalendarDate;
      onSelect: () => void;
}) {
      const doneStates = card.coreStates.filter((state) => state.done);
      const bullets = card.did.slice(0, VISIBLE_BULLETS);
      const overflow = card.did.length - bullets.length;

      return (
            <button
                  type="button"
                  onClick={onSelect}
                  className="flex h-full w-full flex-col rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 text-left transition-colors hover:border-white/12 hover:bg-white/[0.04]"
            >
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                        <span className="text-[12px] font-medium text-zinc-400">
                              {formatCalendarDate(card.date, {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                              })}
                              {card.date === today && (
                                    <span className="ml-2 text-indigo-400">today</span>
                              )}
                        </span>
                        {card.coreStates.length > 0 && (
                              <span className="text-[11px] tabular-nums text-zinc-600">
                                    {doneStates.length}/{card.coreStates.length}
                              </span>
                        )}
                  </div>

                  <ul className="space-y-1">
                        {bullets.map((bullet, index) => (
                              <li
                                    key={index}
                                    className="flex gap-2.5 text-[14px] leading-relaxed text-zinc-200"
                              >
                                    <span className="select-none text-zinc-700">—</span>
                                    <span className="line-clamp-2">{bullet}</span>
                              </li>
                        ))}
                  </ul>

                  {/* Truncation is stated, never silent: the day had more in it. */}
                  {overflow > 0 && (
                        <p className="mt-1.5 pl-[18px] text-[12px] text-zinc-600">
                              +{overflow} more
                        </p>
                  )}

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
                        // Pinned to the bottom of the tile so a row of cards of
                        // different lengths still lines its footers up.
                        <div className="mt-auto pt-3">
                              <p className="border-t border-white/[0.06] pt-2.5 text-[12px] text-zinc-500">
                                    <span className="text-zinc-600">Avoided </span>
                                    {card.avoided}
                              </p>
                        </div>
                  )}
            </button>
      );
}
