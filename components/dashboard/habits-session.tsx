"use client";

import { CheckCircle2, Flame, Trophy, Crown } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHabitRank } from "@/lib/habits";
import { cn } from "@/lib/utils";

export function HabitsSession() {
  const queryClient = useQueryClient();
  const { data: habits } = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const res = await axios.get("/api/habits");
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const res = await axios.post(`/api/habits/${habitId}/check`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  const activeHabits = habits?.filter((h: any) => !h.archived) || [];
  const masteredHabits = habits?.filter((h: any) => h.archived) || [];

  // Sort active habits by streak descending
  const topHabits = activeHabits
    .sort((a: any, b: any) => b.streak - a.streak)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Active Quests Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Crown className="size-3 text-orange-500" />
          Top Quests
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {topHabits.length === 0 && (
            <p className="text-xs text-zinc-600 italic">No active habits.</p>
          )}
          {topHabits.map((habit: any) => {
            const { currentRank, color, progress } = getHabitRank(habit.streak);
            return (
              <div
                key={habit.id}
                onClick={() => toggleMutation.mutate(habit.id)}
                className={cn(
                  "relative overflow-hidden rounded-lg bg-white/5 border border-white/5 p-3 group hover:bg-white/10 transition-colors cursor-pointer",
                  toggleMutation.isPending && "opacity-50 pointer-events-none"
                )}
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="text-sm font-medium text-white block">
                      {habit.name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        color
                      )}
                    >
                      {currentRank}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block">
                      {habit.streak} Days
                    </span>
                  </div>
                </div>
                {/* Rank Progress Bar */}
                <div className="h-1 w-full bg-black/50 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      color.replace("text-", "bg-")
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mastered Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Trophy className="size-3 text-yellow-500" />
          Mastered
        </h4>
        <div className="flex flex-wrap gap-2">
          {masteredHabits.length === 0 && (
            <p className="text-xs text-zinc-600 italic">
              No mastered habits yet.
            </p>
          )}
          {masteredHabits.slice(0, 5).map((habit: any) => (
            <div
              key={habit.id}
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400"
            >
              <CheckCircle2 className="size-3" />
              {habit.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
