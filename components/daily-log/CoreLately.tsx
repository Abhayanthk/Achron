"use client";

import { useMemo } from "react";

import type { CoreItemRecord, DailyCardRecord } from "@/lib/daily-log/types";

import { FieldLabel, Panel, RateBar } from "./primitives";

interface CoreLatelyProps {
      /** The recent cards already on the page — no extra fetch for this tile. */
      cards: DailyCardRecord[];
      /** Current items, used for labels and order. History can outlive them. */
      coreItems: CoreItemRecord[];
}

interface CoreTally {
      id: string;
      label: string;
      /** Cards in the window where this item was ticked. */
      done: number;
      /** Cards in the window that carried this item at all. */
      appearances: number;
}

/**
 * Each core item, counted across the cards on screen.
 *
 * Counts of days *done*, never of days missed — the number rises when the item
 * is ticked and is otherwise simply smaller, which is the same rule the
 * consistency meter follows. Read as "where the spine actually holds", not as a
 * report card.
 */
export function CoreLately({ cards, coreItems }: CoreLatelyProps) {
      const tallies = useMemo(() => tallyCore(cards, coreItems), [cards, coreItems]);

      return (
            <Panel className="gap-5">
                  <div className="flex items-baseline justify-between gap-3">
                        <FieldLabel>Core, lately</FieldLabel>
                        {tallies.length > 0 && (
                              <span className="text-[11px] tabular-nums text-zinc-600">
                                    last {cards.length} {cards.length === 1 ? "card" : "cards"}
                              </span>
                        )}
                  </div>

                  {tallies.length === 0 ? (
                        <p className="text-[13px] text-zinc-600">
                              Nothing to count yet — core items show up here once they ride a
                              few cards.
                        </p>
                  ) : (
                        <ul className="space-y-4">
                              {tallies.map((tally) => (
                                    <li key={tally.id} className="space-y-2">
                                          <div className="flex items-baseline justify-between gap-3">
                                                <span className="truncate text-[14px] text-zinc-300">
                                                      {tally.label}
                                                </span>
                                                <span className="shrink-0 text-[12px] tabular-nums text-zinc-500">
                                                      {tally.done}
                                                      <span className="text-zinc-700">
                                                            /{tally.appearances}
                                                      </span>
                                                </span>
                                          </div>
                                          <RateBar
                                                percentage={(tally.done / tally.appearances) * 100}
                                                className="h-1"
                                          />
                                    </li>
                              ))}
                        </ul>
                  )}
            </Panel>
      );
}

/**
 * Fold the cards' snapshots into one row per item.
 *
 * Ordered by the current core list so the tile reads in the same order as the
 * card editor; items that have since been removed still appear, after the live
 * ones, because their history happened and shouldn't silently vanish.
 */
function tallyCore(
      cards: DailyCardRecord[],
      coreItems: CoreItemRecord[],
): CoreTally[] {
      const byId = new Map<string, CoreTally>();

      for (const card of cards) {
            for (const state of card.coreStates) {
                  const tally = byId.get(state.coreItemId) ?? {
                        id: state.coreItemId,
                        // Fallback only: the snapshot label is what that day committed to.
                        label: state.labelSnapshot,
                        done: 0,
                        appearances: 0,
                  };
                  tally.appearances += 1;
                  if (state.done) tally.done += 1;
                  byId.set(state.coreItemId, tally);
            }
      }

      const live: CoreTally[] = [];
      for (const item of coreItems) {
            const tally = byId.get(item.id);
            if (!tally) continue;
            live.push({ ...tally, label: item.label });
            byId.delete(item.id);
      }

      return [...live, ...byId.values()];
}
