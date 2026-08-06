"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CalendarDate } from "@/lib/daily-log/date";
import type { CoreItemRecord, DailyCardRecord } from "@/lib/daily-log/types";

import { FieldLabel } from "./primitives";
import { useSaveCard } from "./use-save-card";

interface CardEditorProps {
      date: CalendarDate;
      /** The card as it stands, or null for a day not yet written. */
      card: DailyCardRecord | null;
      /** Used only when creating: an existing card carries its own snapshots. */
      coreItems: CoreItemRecord[];
      /** Opens the core-items editor. Omitted where that isn't reachable. */
      onManageCore?: () => void;
      onSaved?: () => void;
      autoFocus?: boolean;
}

/**
 * The card itself: bullets, checkboxes, one line, one Save.
 *
 * Under-60-seconds is a hard constraint, so this is deliberately three plain
 * inputs and a button — no rich text, no modal chain, no required fields beyond
 * a single bullet. The checkboxes come from the card's own snapshots when it
 * exists, so editing an old card shows the labels committed to that day.
 */
export function CardEditor({
      date,
      card,
      coreItems,
      onManageCore,
      onSaved,
      autoFocus = false,
}: CardEditorProps) {
      const { mutate, isPending } = useSaveCard();

      // Seeded once per mounted day. Callers pass `key={date}`, so switching days
      // remounts and reseeds — no effect syncing props into state, and a
      // background refetch can never overwrite what is being typed.
      const [did, setDid] = useState(() => card?.did.join("\n") ?? "");
      const [avoided, setAvoided] = useState(() => card?.avoided ?? "");
      const [done, setDone] = useState<Record<string, boolean>>(() =>
            initialDone(card, coreItems),
      );

      const checkboxes = useMemo(
            () =>
                  card
                        ? card.coreStates.map((state) => ({
                                id: state.coreItemId,
                                label: state.labelSnapshot,
                          }))
                        : coreItems.map((item) => ({ id: item.id, label: item.label })),
            [card, coreItems],
      );

      const hasContent = did.trim().length > 0;
      const doneCount = checkboxes.filter((box) => done[box.id]).length;

      const handleSave = () => {
            mutate(
                  {
                        date,
                        did,
                        avoided,
                        core: checkboxes.map((box) => ({
                              coreItemId: box.id,
                              done: done[box.id] ?? false,
                        })),
                  },
                  { onSuccess: () => onSaved?.() },
            );
      };

      return (
            <div className="space-y-7">
                  <section className="space-y-2.5">
                        <FieldLabel htmlFor={`did-${date}`}>Did</FieldLabel>
                        <Textarea
                              id={`did-${date}`}
                              value={did}
                              autoFocus={autoFocus}
                              onChange={(event) => setDid(event.target.value)}
                              placeholder={"One line per thing.\nNothing is too small to write."}
                              rows={5}
                              className="resize-y rounded-xl border-white/10 bg-white/[0.02] px-4 py-3 text-[15px] leading-relaxed text-zinc-100 shadow-none transition-colors placeholder:text-zinc-600 focus-visible:border-indigo-500/50 focus-visible:ring-[3px] focus-visible:ring-indigo-500/10"
                        />
                  </section>

                  <section className="space-y-2.5">
                        <div className="flex items-baseline justify-between gap-3">
                              <FieldLabel>Core</FieldLabel>
                              {checkboxes.length > 0 && (
                                    <span className="text-[11px] tabular-nums text-zinc-600">
                                          {doneCount} of {checkboxes.length}
                                    </span>
                              )}
                        </div>

                        {checkboxes.length === 0 ? (
                              <CoreEmptyState onManageCore={onManageCore} />
                        ) : (
                              <div className="space-y-1.5">
                                    {checkboxes.map((box) => {
                                          const checked = done[box.id] ?? false;
                                          return (
                                                <label
                                                      key={box.id}
                                                      htmlFor={`core-${date}-${box.id}`}
                                                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150 ${
                                                            checked
                                                                  ? "border-indigo-500/30 bg-indigo-500/[0.07]"
                                                                  : "border-white/[0.07] bg-white/[0.015] hover:border-white/15 hover:bg-white/[0.04]"
                                                      }`}
                                                >
                                                      <Checkbox
                                                            id={`core-${date}-${box.id}`}
                                                            checked={checked}
                                                            onCheckedChange={(next) =>
                                                                  setDone((current) => ({
                                                                        ...current,
                                                                        [box.id]: next === true,
                                                                  }))
                                                            }
                                                            className="size-[18px] rounded-[5px] border-zinc-700 data-[state=checked]:border-indigo-500 data-[state=checked]:bg-indigo-600"
                                                      />
                                                      <span
                                                            className={`text-[15px] transition-colors ${
                                                                  checked ? "text-white" : "text-zinc-300"
                                                            }`}
                                                      >
                                                            {box.label}
                                                      </span>
                                                </label>
                                          );
                                    })}
                              </div>
                        )}
                  </section>

                  <section className="space-y-2.5">
                        <FieldLabel htmlFor={`avoided-${date}`}>Avoided</FieldLabel>
                        <Input
                              id={`avoided-${date}`}
                              value={avoided}
                              onChange={(event) => setAvoided(event.target.value)}
                              placeholder="What did you dodge today?"
                              className="h-11 rounded-xl border-white/10 bg-white/[0.02] px-4 text-[15px] text-zinc-100 shadow-none transition-colors placeholder:text-zinc-600 focus-visible:border-indigo-500/50 focus-visible:ring-[3px] focus-visible:ring-indigo-500/10"
                        />
                  </section>

                  <div className="flex items-center gap-4 pt-1">
                        <Button
                              onClick={handleSave}
                              disabled={isPending || !hasContent}
                              className="h-10 rounded-lg bg-indigo-600 px-6 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
                        >
                              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                              Save
                        </Button>
                        <span className="text-[13px] text-zinc-600">
                              {hasContent ? "One tap, done." : "One line is enough."}
                        </span>
                  </div>
            </div>
      );
}

/**
 * Without core items the card has no spine and the heatmap can only ever reach
 * its lowest tint — so this offers the fix directly rather than rendering an
 * empty gap and leaving the user to find the settings.
 */
function CoreEmptyState({ onManageCore }: { onManageCore?: () => void }) {
      return (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center">
                  <p className="text-[13px] text-zinc-500">
                        No core items yet — pick the two or three that count.
                  </p>
                  {onManageCore && (
                        <Button
                              variant="ghost"
                              size="sm"
                              onClick={onManageCore}
                              className="mt-2 h-8 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
                        >
                              <Plus className="mr-1.5 size-3.5" />
                              Add core items
                        </Button>
                  )}
            </div>
      );
}

function initialDone(
      card: DailyCardRecord | null,
      coreItems: CoreItemRecord[],
): Record<string, boolean> {
      const source = card
            ? card.coreStates.map((state) => [state.coreItemId, state.done] as const)
            : coreItems.map((item) => [item.id, false] as const);
      return Object.fromEntries(source);
}
