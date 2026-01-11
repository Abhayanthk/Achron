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

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Main Level Display */}
      <a
        href="/journey"
        className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-zinc-900 to-black p-6 hover:border-white/20 transition-all cursor-pointer shrink-0"
      >
        <div>
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">
            Total Level
          </h3>
          <p className="text-4xl font-bold text-white mt-1">LVL 77</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">
            Next Milestone
          </p>
          <p className="text-lg font-bold text-white flex items-center gap-2">
            LVL 80
          </p>
        </div>
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-zinc-800/20 blur-3xl rounded-full -z-10 group-hover:bg-zinc-800/30 transition-all" />
      </a>

      {/* Grid of Stats */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {statItems.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "flex flex-col justify-center p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors",
              idx === statItems.length - 1 && statItems.length % 2 !== 0
                ? "col-span-2 flex-row items-center justify-between"
                : ""
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-1.5 rounded-md ${item.bg} ${item.color}`}>
                <item.icon className="size-4" />
              </div>
              {idx === statItems.length - 1 && statItems.length % 2 !== 0 && (
                <span className="text-sm font-medium text-zinc-400">
                  {item.label}
                </span>
              )}
            </div>
            <div
              className={cn(
                idx === statItems.length - 1 && statItems.length % 2 !== 0
                  ? "text-right"
                  : ""
              )}
            >
              {!(
                idx === statItems.length - 1 && statItems.length % 2 !== 0
              ) && (
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1">
                  {item.label}
                </span>
              )}
              <span className="text-xl font-bold text-white tracking-tight">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
