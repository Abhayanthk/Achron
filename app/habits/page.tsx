"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CreateHabitDialog } from "@/components/habits/create-habit-dialog";
import { HabitCard } from "@/components/habits/habit-card";
import {
  Loader2,
  Shield,
  Sword,
  Crown,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { HABIT_RANKS } from "@/lib/habits";
import { cn } from "@/lib/utils";

interface Habit {
  id: string;
  name: string;
  streak: number;
  completedDates: string[];
  targetDays: number | null;
  startDate: string;
  archived: boolean;
}

export default function HabitsPage() {
  const { data: habits, isLoading } = useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: async () => {
      const res = await axios.get("/api/habits");
      return res.data;
    },
  });

  const activeHabits = habits?.filter((h) => !h.archived) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
      {/* Sidebar / Info Panel */}
      <aside className="w-full lg:w-80 border-r border-white/5 bg-zinc-900/30 p-6 shrink-0">
        <div className="space-y-8 sticky top-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Habit Mastery
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Journey to greatness. Endless growth.
            </p>
          </div>

          <CreateHabitDialog />

          {/* Rank Legend */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Crown className="size-4" />
              Rank Hierarchy
            </h3>
            <div className="space-y-2">
              {HABIT_RANKS.map((rank) => (
                <div
                  key={rank.name}
                  className="flex items-center justify-between text-sm p-2 rounded-lg bg-white/5 border border-white/5"
                >
                  <div className={cn("font-medium", rank.color)}>
                    {rank.name}
                  </div>
                  <div className="text-zinc-500 text-xs">
                    {rank.maxDays
                      ? `${rank.minDays}-${rank.maxDays} Days`
                      : `${rank.minDays}+ Days`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid gap-4">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-medium">
                <Zap className="size-4" />
                <span>XP Rewards</span>
              </div>
              <p className="text-xs text-blue-200/60">
                Earn <span className="text-white font-bold">+50 XP</span> for
                every daily completion. Level up your profile as you build
                habits.
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-medium">
                <AlertTriangle className="size-4" />
                <span>Penalty</span>
              </div>
              <p className="text-xs text-red-200/60">
                Miss consecutive days and face the penalty:{" "}
                <span className="font-mono bg-black/20 px-1 rounded">
                  -2^(n-1)
                </span>{" "}
                days from your streak.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Grid */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sword className="size-5 text-zinc-500" />
              Your Active Quests
            </h2>
            <span className="text-zinc-500 text-sm">
              {activeHabits.length} Active
            </span>
          </div>

          {activeHabits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeHabits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
              <Shield className="size-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-zinc-400 font-medium">No active habits</h3>
              <p className="text-zinc-600 text-sm mt-1">
                Start your journey by creating a new habit quest.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
