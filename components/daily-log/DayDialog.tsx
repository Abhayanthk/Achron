"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Check, Minus } from "lucide-react";

import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCalendarDate, type CalendarDate } from "@/lib/daily-log/date";
import type { CardEditability } from "@/lib/daily-log/domain";
import type { CoreItemRecord, DailyCardRecord } from "@/lib/daily-log/types";

import { CardEditor } from "./CardEditor";

interface DayResponse {
      date: CalendarDate;
      card: DailyCardRecord | null;
      editability: CardEditability;
}

interface DayDialogProps {
      date: CalendarDate | null;
      coreItems: CoreItemRecord[];
      onOpenChange: (open: boolean) => void;
}

/**
 * One day, opened from the heatmap or the recent list.
 *
 * Editable inside the backfill window, read-only outside it. The server sends
 * `editability` with the card, so the client never decides that on its own.
 */
export function DayDialog({ date, coreItems, onOpenChange }: DayDialogProps) {
      const { data, isLoading, isError, refetch } = useQuery({
            queryKey: ["daily-log", "day", date],
            queryFn: async () => {
                  const { data } = await axios.get<DayResponse>(
                        `/api/daily-log/cards/${date}`,
                  );
                  return data;
            },
            enabled: date !== null,
      });

      return (
            <Dialog open={date !== null} onOpenChange={onOpenChange}>
                  <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-lg">
                        <DialogHeader>
                              <DialogTitle>{date ? formatDay(date) : ""}</DialogTitle>
                              <DialogDescription className="text-zinc-500">
                                    {data?.editability === "editable"
                                          ? "Still within the window — you can edit this."
                                          : "Read-only."}
                              </DialogDescription>
                        </DialogHeader>

                        {isLoading && (
                              <div className="space-y-3">
                                    <Skeleton className="h-24 w-full bg-white/5" />
                                    <Skeleton className="h-10 w-full bg-white/5" />
                              </div>
                        )}

                        {isError && (
                              <div className="space-y-3 text-sm text-zinc-400">
                                    <p>Could not load that day.</p>
                                    <button
                                          type="button"
                                          onClick={() => void refetch()}
                                          className="text-indigo-400 underline-offset-4 hover:underline"
                                    >
                                          Try again
                                    </button>
                              </div>
                        )}

                        {data &&
                              (data.editability === "editable" ? (
                                    <CardEditor
                                          key={data.date}
                                          date={data.date}
                                          card={data.card}
                                          coreItems={coreItems}
                                          onSaved={() => onOpenChange(false)}
                                    />
                              ) : (
                                    <ReadOnlyCard card={data.card} />
                              ))}
                  </DialogContent>
            </Dialog>
      );
}

function ReadOnlyCard({ card }: { card: DailyCardRecord | null }) {
      // No card is stated flatly. Nothing is offered to "fix" a day that has passed.
      if (!card) {
            return <p className="text-sm text-zinc-500">No card for this day.</p>;
      }

      return (
            <div className="space-y-5">
                  <section className="space-y-2">
                        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                              Did
                        </h3>
                        <ul className="space-y-1.5">
                              {card.did.map((bullet, index) => (
                                    <li key={index} className="flex gap-2 text-sm text-zinc-200">
                                          <span className="text-zinc-600">—</span>
                                          <span>{bullet}</span>
                                    </li>
                              ))}
                        </ul>
                  </section>

                  {card.coreStates.length > 0 && (
                        <section className="space-y-2">
                              <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                                    Core
                              </h3>
                              <ul className="space-y-1.5">
                                    {card.coreStates.map((state) => (
                                          <li
                                                key={state.coreItemId}
                                                className="flex items-center gap-2 text-sm"
                                          >
                                                {state.done ? (
                                                      <Check className="h-4 w-4 text-indigo-400" />
                                                ) : (
                                                      <Minus className="h-4 w-4 text-zinc-600" />
                                                )}
                                                <span
                                                      className={
                                                            state.done ? "text-zinc-200" : "text-zinc-500"
                                                      }
                                                >
                                                      {state.labelSnapshot}
                                                </span>
                                          </li>
                                    ))}
                              </ul>
                        </section>
                  )}

                  {card.avoided && (
                        <section className="space-y-2">
                              <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                                    Avoided
                              </h3>
                              <p className="text-sm text-zinc-300">{card.avoided}</p>
                        </section>
                  )}
            </div>
      );
}

function formatDay(date: CalendarDate): string {
      return formatCalendarDate(date, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
      });
}
