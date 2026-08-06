"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { CoreItemRecord } from "@/lib/daily-log/types";

import { DAILY_LOG_QUERY_KEY } from "./use-save-card";

const CORE_ITEMS_KEY = ["daily-log", "core-items"] as const;

/**
 * Manage the core items — the two or three things fixed in advance.
 *
 * Renaming or switching one off only affects cards written from now on: every
 * existing card keeps the label it was created with, so the past can't be
 * edited by moving the goalposts today.
 */
export function CoreItemsDialog({
      open,
      onOpenChange,
}: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
}) {
      const queryClient = useQueryClient();
      const [label, setLabel] = useState("");

      const { data: items = [], isLoading } = useQuery({
            queryKey: CORE_ITEMS_KEY,
            queryFn: async () => {
                  const { data } = await axios.get<CoreItemRecord[]>(
                        "/api/daily-log/core-items?includeInactive=1",
                  );
                  return data;
            },
            enabled: open,
      });

      const invalidate = () => {
            void queryClient.invalidateQueries({ queryKey: CORE_ITEMS_KEY });
            void queryClient.invalidateQueries({ queryKey: DAILY_LOG_QUERY_KEY });
      };

      const { mutate: create, isPending: isCreating } = useMutation({
            mutationFn: (value: string) =>
                  axios.post("/api/daily-log/core-items", { label: value }),
            onSuccess: () => {
                  setLabel("");
                  invalidate();
            },
            onError: () => toast.error("Could not add that item"),
      });

      const { mutate: patch } = useMutation({
            mutationFn: ({ id, ...body }: { id: string } & Partial<CoreItemRecord>) =>
                  axios.patch(`/api/daily-log/core-items/${id}`, body),
            onSuccess: invalidate,
            onError: () => toast.error("Could not update that item"),
      });

      return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                  <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-md">
                        <DialogHeader>
                              <DialogTitle>Core items</DialogTitle>
                              <DialogDescription className="text-zinc-500">
                                    Two or three, fixed in advance. Past cards keep the labels they
                                    were written with.
                              </DialogDescription>
                        </DialogHeader>

                        <form
                              onSubmit={(event) => {
                                    event.preventDefault();
                                    if (label.trim()) create(label.trim());
                              }}
                              className="flex gap-2"
                        >
                              <Input
                                    value={label}
                                    onChange={(event) => setLabel(event.target.value)}
                                    placeholder="One problem"
                                    maxLength={80}
                                    className="border-zinc-800 bg-black/40 text-zinc-100 placeholder:text-zinc-600"
                              />
                              <Button
                                    type="submit"
                                    size="icon"
                                    disabled={isCreating || !label.trim()}
                                    className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-500"
                              >
                                    <Plus className="h-4 w-4" />
                              </Button>
                        </form>

                        <ul className="space-y-2">
                              {isLoading && <li className="text-sm text-zinc-500">Loading…</li>}

                              {!isLoading && items.length === 0 && (
                                    <li className="text-sm text-zinc-500">
                                          None yet. Add the two or three that matter.
                                    </li>
                              )}

                              {items.map((item) => (
                                    <li
                                          key={item.id}
                                          className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/30 px-3 py-2"
                                    >
                                          <Input
                                                defaultValue={item.label}
                                                maxLength={80}
                                                onBlur={(event) => {
                                                      const next = event.target.value.trim();
                                                      if (next && next !== item.label) {
                                                            patch({ id: item.id, label: next });
                                                      }
                                                }}
                                                className="h-8 border-transparent bg-transparent px-1 text-sm text-zinc-200 focus-visible:border-zinc-700"
                                          />
                                          <Switch
                                                checked={item.active}
                                                onCheckedChange={(active) => patch({ id: item.id, active })}
                                                className="data-[state=checked]:bg-indigo-600"
                                          />
                                    </li>
                              ))}
                        </ul>
                  </DialogContent>
            </Dialog>
      );
}
