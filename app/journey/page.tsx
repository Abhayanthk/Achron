"use client";

import PixelBlast from "@/components/PixelBlast";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";

import { LevelProfileCard } from "@/components/journey/level-profile-card";
import { LogsAnalytics } from "@/components/analytics/logs-analytics";
import { TasksAnalytics } from "@/components/analytics/tasks-analytics";
import { TimerAnalytics } from "@/components/analytics/timer-analytics";
import { XpHistoryGraph } from "@/components/analytics/xp-line-graph";
import { ProjectStatusChart } from "@/components/analytics/project-status-chart";
import { HabitGraph } from "@/components/analytics/habit-graph";
import { ConfidenceMountain } from "@/components/non-negotiable/confidence-mountain";

export default function JourneyPage() {
  const { data: nonNegotiables = [], isLoading } = useQuery({
    queryKey: ["non-negotiables"],
    queryFn: async () => {
      const res = await axios.get("/api/non-negotiables");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col">
      {/* Background Effect */}
      <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
        <PixelBlast
          variant="circle"
          pixelSize={3}
          color="#1a1a2e"
          patternScale={6}
          patternDensity={1.2}
          speed={0.2}
          transparent
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto p-6 space-y-8">
        {/* New Header / Profile Section */}
        <section className="space-y-6">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            The Path
          </h1>
          <LevelProfileCard />
        </section>

        {/* Core Analytics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LogsAnalytics />
          <TasksAnalytics />
          <div className="lg:col-span-1">
            <ProjectStatusChart />
          </div>

          <div className="lg:col-span-2">
            <XpHistoryGraph />
          </div>
          <div className="lg:col-span-1">
            <TimerAnalytics />
          </div>

          <div className="lg:col-span-1">
            <HabitGraph />
          </div>
          <div className="lg:col-span-2">
            <ConfidenceMountain items={nonNegotiables} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
          {/* Future sections */}
        </div>
      </div>
    </div>
  );
}
