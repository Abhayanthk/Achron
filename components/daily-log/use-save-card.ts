"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import type { CalendarDate } from "@/lib/daily-log/date";
import { rollingConsistency } from "@/lib/daily-log/domain";
import type { DailyCardRecord, DailyLogPageData } from "@/lib/daily-log/types";

export const DAILY_LOG_QUERY_KEY = ["daily-log"] as const;

export interface SaveCardPayload {
      date: CalendarDate;
      /** Raw textarea value; the server splits and trims it. */
      did: string;
      avoided: string;
      core: { coreItemId: string; done: boolean }[];
}

/**
 * Save one day's card, applying the result to the cached page immediately.
 *
 * The optimistic patch is what makes a save feel like a save rather than a
 * request: the card, the heatmap cell and the rolling count all move on click.
 * A failure rolls the cache back and says so — nothing fails silently.
 */
export function useSaveCard() {
      const queryClient = useQueryClient();

      return useMutation({
            mutationFn: async (payload: SaveCardPayload) => {
                  const { data } = await axios.post<DailyCardRecord>(
                        "/api/daily-log",
                        payload,
                  );
                  return data;
            },

            onMutate: async (payload) => {
                  await queryClient.cancelQueries({ queryKey: DAILY_LOG_QUERY_KEY });
                  const previous = queryClient.getQueryData<DailyLogPageData>(
                        DAILY_LOG_QUERY_KEY,
                  );
                  if (previous) {
                        queryClient.setQueryData<DailyLogPageData>(
                              DAILY_LOG_QUERY_KEY,
                              applyOptimisticSave(previous, payload),
                        );
                  }
                  return { previous };
            },

            onError: (_error, _payload, context) => {
                  if (context?.previous) {
                        queryClient.setQueryData(DAILY_LOG_QUERY_KEY, context.previous);
                  }
                  toast.error("Could not save that card", {
                        description: "Nothing was lost — try again.",
                  });
            },

            // Re-read regardless: the server owns core-state snapshots and the
            // authoritative date, and it may have written less than we guessed.
            onSettled: () => {
                  void queryClient.invalidateQueries({ queryKey: DAILY_LOG_QUERY_KEY });
            },
      });
}

/**
 * Predict the saved card well enough to render it, without duplicating server
 * rules: only states already on the card can change, so an unknown core item in
 * the payload is ignored here exactly as the repository ignores it.
 */
function applyOptimisticSave(
      page: DailyLogPageData,
      payload: SaveCardPayload,
): DailyLogPageData {
      const existing =
            page.todayCard?.date === payload.date
                  ? page.todayCard
                  : page.recentCards.find((card) => card.date === payload.date);

      const doneById = new Map(payload.core.map((state) => [state.coreItemId, state.done]));

      const coreStates = existing
            ? existing.coreStates.map((state) => ({
                    ...state,
                    done: doneById.get(state.coreItemId) ?? state.done,
              }))
            : page.coreItems.map((item) => ({
                    coreItemId: item.id,
                    labelSnapshot: item.label,
                    done: doneById.get(item.id) ?? false,
              }));

      const optimistic: DailyCardRecord = {
            id: existing?.id ?? `optimistic-${payload.date}`,
            date: payload.date,
            did: payload.did
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
            avoided: payload.avoided.trim() || null,
            coreStates,
      };

      const summary = {
            date: payload.date,
            coreDone: coreStates.filter((state) => state.done).length,
            coreTotal: coreStates.length,
      };

      const cardSummaries = page.cardSummaries.some((item) => item.date === payload.date)
            ? page.cardSummaries.map((item) => (item.date === payload.date ? summary : item))
            : [...page.cardSummaries, summary].sort((a, b) => a.date.localeCompare(b.date));

      const recentCards = page.recentCards.some((card) => card.date === payload.date)
            ? page.recentCards.map((card) => (card.date === payload.date ? optimistic : card))
            : [optimistic, ...page.recentCards].sort((a, b) => b.date.localeCompare(a.date));

      return {
            ...page,
            todayCard: payload.date === page.today ? optimistic : page.todayCard,
            cardSummaries,
            recentCards,
            emptyBackfillDays: page.emptyBackfillDays.filter((date) => date !== payload.date),
            // Recomputed with the same function the server uses, so the headline
            // number moves with the save instead of lagging a request behind.
            consistency:
                  page.consistency === null
                        ? null
                        : rollingConsistency(
                                cardSummaries.map((item) => item.date),
                                page.today,
                          ),
      };
}
