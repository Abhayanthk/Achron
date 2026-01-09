"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, AlertCircle, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { differenceInCalendarDays, isSameDay } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getHabitRank } from "@/lib/habits";

interface Habit {
  id: string;
  name: string;
  streak: number;
  completedDates: string[];
  targetDays: number | null;
  startDate: string;
  archived: boolean;
}

interface HabitCardProps {
  habit: Habit;
}

export function HabitCard({ habit }: HabitCardProps) {
  const queryClient = useQueryClient();

  const completedDates = habit.completedDates.map((d) => new Date(d));
  const today = new Date();
  const isCompletedToday = completedDates.some((d) => isSameDay(d, today));

  const sortedDates = completedDates.sort((a, b) => b.getTime() - a.getTime());
  const lastCompleted = sortedDates[0];
  const daysSinceLast = lastCompleted
    ? differenceInCalendarDays(today, lastCompleted)
    : 0;
  const isAtRisk = !isCompletedToday && daysSinceLast >= 2;
  const potentialPenalty = Math.pow(2, daysSinceLast - 1 - 1);

  const { currentRank, color, progress, nextRankThreshold } = getHabitRank(
    habit.streak
  );

  const { mutate: toggleCheck, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`/api/habits/${habit.id}/check`);
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      const previousHabits = queryClient.getQueryData(["habits"]);

      queryClient.setQueryData(["habits"], (old: Habit[] | undefined) => {
        if (!old) return [];
        return old.map((h) => {
          if (h.id === habit.id) {
            const wasCompleted = isCompletedToday;
            const newDates = wasCompleted
              ? h.completedDates.filter((d) => !isSameDay(new Date(d), today))
              : [...h.completedDates, today.toISOString()];

            const newStreak = wasCompleted
              ? Math.max(0, h.streak - 1)
              : h.streak + 1;

            return {
              ...h,
              completedDates: newDates,
              streak: newStreak,
            };
          }
          return h;
        });
      });

      return { previousHabits };
    },
    onError: (err, newTodo, context: any) => {
      queryClient.setQueryData(["habits"], context.previousHabits);
      toast.error("Failed to update habit");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      if (!isCompletedToday) {
        toast.success("Habit Completed! (+50 XP)");
      }
    },
  });

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 p-6 hover:border-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 flex flex-col items-center text-center gap-4">
      {/* Dynamic Background Glow based on Rank Color/State */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-t",
          color.replace("text-", "from-").replace("500", "500/20")
        )}
      />

      {/* Rank Badge */}
      <div
        className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-white/5",
          color,
          `border-${color.split("-")[1]}-500/20`
        )}
      >
        {currentRank}
      </div>

      {/* Streak Counter (Large) */}
      <div className="relative">
        <h2
          className={cn(
            "text-6xl font-black tabular-nums tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50",
            color
          )}
        >
          {habit.streak}
        </h2>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
          Day Streak
        </p>

        {/* Risk Badge Absolute */}
        {isAtRisk && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -top-2 -right-4 bg-red-500/20 text-red-400 p-1.5 rounded-full animate-pulse border border-red-500/50">
                  <AlertCircle className="size-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Missed days! Risk: -{potentialPenalty} days</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Habit Name */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white group-hover:text-blue-200 transition-colors">
          {habit.name}
        </h3>
        {nextRankThreshold && (
          <p className="text-[10px] text-zinc-500">
            {nextRankThreshold - habit.streak} days to next rank
          </p>
        )}
      </div>

      {/* Progress Bar To Next Rank */}
      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-2">
        <motion.div
          className={cn("h-full rounded-full", color.replace("text-", "bg-"))}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Check Button (Big) */}
      <button
        onClick={() => toggleCheck()}
        disabled={isPending}
        className={cn(
          "mt-2 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:scale-110",
          isCompletedToday
            ? "bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.6)]"
            : "bg-zinc-800 text-zinc-600 hover:bg-zinc-700 hover:text-white border border-white/5"
        )}
      >
        <AnimatePresence mode="wait">
          {isCompletedToday ? (
            <motion.div
              key="checked"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
            >
              <Check className="h-8 w-8" strokeWidth={3} />
            </motion.div>
          ) : (
            <div className="h-4 w-4 bg-current rounded-full" />
          )}
        </AnimatePresence>
      </button>

      {/* Footer Info */}
      <div className="flex items-center gap-2 text-[10px] text-zinc-600 mt-2">
        <TrendingUp className="size-3" />
        <span>+50 XP per day</span>
      </div>
    </div>
  );
}
