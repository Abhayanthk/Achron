"use client";

import {
  Brain,
  CheckCircle,
  Clock,
  Flame,
  Heart,
  List,
  Target,
  Trophy,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { cn } from "@/lib/utils";
import { calculateLevelFromXp, TITLES } from "@/lib/level-system";

export function IdentityProgress() {
  const { data: stats } = useQuery({
    queryKey: ["journey-stats"],
    queryFn: async () => {
      const res = await axios.get("/api/analytics?type=identity_stats");
      return res.data;
    },
    initialData: {
      likes: 0,
      logsCount: 0,
      tasksCount: 0,
      deepHours: 0,
      nonNegoScore: 0, // Changed from nonNegoPoints to match API
      projectsCompleted: 0,
      habitsActive: 0,
    },
  });

  // Mapping for the requested stats
  const statItems = [
    {
      label: "Logs Created",
      value: stats.logsCount,
      icon: List,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Tasks Done",
      value: stats.tasksCount,
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Deep Hours",
      value: `${stats.deepHours.toFixed(1)}h`,
      icon: Clock,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Non-Nego Pts",
      value: stats.nonNegoScore,
      icon: Target,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Projects Done",
      value: stats.projectsCompleted,
      icon: Trophy,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Active Habits",
      value: stats.habitsActive,
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];
  //   Fetching all XP logs
  const { data: xpLogs = [] } = useQuery({
    queryKey: ["analytics", "xp", "all"],
    queryFn: async () => {
      const res = await axios.get("/api/analytics?type=xp&range=all");
      return res.data.data;
    },
  });
  const { level, currentXp, nextLevelXp, progress, title } =
    calculateLevelFromXp(
      xpLogs.reduce((acc: number, curr: any) => acc + curr.amount, 0)
    );

  return (
    <div className="space-y-6 h-full flex flex-col pb-12">
      {/* Main Level Display */}
      <a
        href="/journey"
        className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-white/10 bg-linear-to-r from-zinc-900 to-black p-6 hover:border-white/20 transition-all cursor-pointer shrink-0"
      >
        <div>
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">
            Level
          </h3>
          <p className="text-4xl font-bold text-white mt-1">LVL {level}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">
            Next Milestone
          </p>
          <p className="text-lg font-bold text-white flex items-center gap-2">
            LVL {level + 1}
          </p>
        </div>
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-zinc-800/20 blur-3xl rounded-full -z-10 group-hover:bg-zinc-800/30 transition-all" />
      </a>

      {/* Grid of Stats */}
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
        {statItems.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "flex flex-col justify-between p-3 rounded-xl border border-white/5 bg-linear-to-br from-white/5 to-white/2 hover:from-white/10 hover:to-white/5 hover:border-white/10 transition-all group/card",
              idx === statItems.length - 1 && statItems.length % 3 !== 0
                ? "col-span-3 sm:col-span-1" // Handle oddouts if any, though 6 is even for 3
                : ""
            )}
          >
            <div className="flex justify-between items-start mb-2">
              {/* <div
                className={cn(
                  "p-1.5 rounded-lg bg-black/40 ring-1 ring-inset ring-white/10 group-hover/card:scale-110 transition-transform",
                  item.color
                )}
              >
                <item.icon className="size-3.5" />
              </div> */}
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight leading-none block mb-1">
                {item.value}
              </span>
              <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest line-clamp-1 group-hover/card:text-zinc-400 transition-colors">
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
