"use client";

import React from "react";
import { Check, Flame, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { cn } from "@/lib/utils";
// import { toast } from "sonner" // Optional for dashboard

interface NonNegotiable {
  id: string;
  title: string;
  completedDates: string[];
}

export function NonNegotiables() {
  const queryClient = useQueryClient();
  const today = new Date();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["non-negotiables"],
    queryFn: async () => {
      const res = await axios.get("/api/non-negotiables");
      return res.data as NonNegotiable[];
    },
  });

  // Calculate generic streak or daily progress
  // For now, let's show "X/Y Completed Today"
  const completedCount = items.filter((i: NonNegotiable) =>
    i.completedDates.some(
      (d) => new Date(d).toDateString() === today.toDateString()
    )
  ).length;

  const total = items.length;
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const { mutate: toggleMutation, isPending: isToggling } = useMutation({
    mutationFn: async ({ id, date }: { id: string; date: Date }) => {
      return axios.put(`/api/non-negotiables/${id}`, {
        action: "toggle",
        date: date.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["non-negotiables"] });
    },
    onSettled: () => {
      setTogglingId(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <Flame
          className={cn(
            "size-4",
            completedCount === total && total > 0
              ? "text-emerald-500"
              : "text-orange-500"
          )}
          fill="currentColor"
        />
        <span>
          {isLoading
            ? "Loading..."
            : `${completedCount}/${total} Completed Today`}
        </span>
      </div>

      <div className="space-y-2">
        {items.slice(0, 3).map((item: NonNegotiable) => {
          const isCompleted = item.completedDates.some(
            (d) => new Date(d).toDateString() === today.toDateString()
          );
          return (
            <div
              key={item.id}
              className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10"
            >
              <span
                className={cn(
                  "truncate max-w-[150px]",
                  isCompleted ? "text-zinc-500 line-through" : "text-zinc-200"
                )}
              >
                {item.title}
              </span>
              {isToggling && item.id === togglingId ? (
                <Loader2 className="animate-spin size-6 text-zinc-500" />
              ) : (
                <button
                  onClick={() => {
                    if (!isCompleted) {
                      setTogglingId(item.id);
                      toggleMutation({ id: item.id, date: today });
                    }
                  }}
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border transition-all",
                    isCompleted
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-500"
                      : "border-zinc-700 bg-black/20 text-transparent hover:border-zinc-500"
                  )}
                >
                  <Check className="size-3" />
                </button>
              )}
            </div>
          );
        })}
        {items.length === 0 && !isLoading && (
          <p className="text-xs text-zinc-600">No non-negotiables set.</p>
        )}
      </div>
    </div>
  );
}
