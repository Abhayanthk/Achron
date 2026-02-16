import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WeaknessHeatmap } from "@/components/cp-tracker/WeaknessHeatmap";
import { TimeAnalysisChart } from "@/components/cp-tracker/TimeAnalysisChart";
import { AccuracyGauge } from "@/components/cp-tracker/AccuracyGauge";
import { RevisionQueue } from "@/components/cp-tracker/RevisionQueue";
import { Button } from "@/components/ui/button";
import { Plus, List, Trophy } from "lucide-react";
import Link from "next/link";
import { subDays } from "date-fns";

export default async function CPTrackerPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch Data
  const logs = await prisma.problemLog.findMany({
    where: { userId },
    include: { patterns: true, tags: true },
  });

  // 1. Weakness Heatmap Data
  const failureCounts: Record<string, number> = {};
  logs.forEach((log) => {
    log.failure_categories.forEach((cat) => {
      failureCounts[cat] = (failureCounts[cat] || 0) + 1;
    });
  });
  const weaknessData = Object.entries(failureCounts).map(
    ([category, count]) => ({
      category,
      count,
    }),
  );

  // 2. Time Analysis Data (Avg time by pattern)
  const patternTimes: Record<string, { total: number; count: number }> = {};
  logs.forEach((log) => {
    const patternName = log.patterns[0]?.name || "Unknown";
    if (!patternTimes[patternName]) {
      patternTimes[patternName] = { total: 0, count: 0 };
    }
    patternTimes[patternName].total += log.total_time_minutes;
    patternTimes[patternName].count += 1;
  });
  const timeAnalysisData = Object.entries(patternTimes).map(
    ([pattern, { total, count }]) => ({
      pattern,
      avgTime: Math.round(total / count),
    }),
  );

  // 3. Accuracy Data (Self-Solved Rate)
  const selfSolvedCount = logs.filter(
    (log) => log.idea_source === "Self",
  ).length;
  const accuracyPercentage =
    logs.length > 0 ? (selfSolvedCount / logs.length) * 100 : 0;

  // 4. Revision Queue (Must Revisit + Last Revised > 7 days ago OR Never)
  const sevenDaysAgo = subDays(new Date(), 7);
  const revisionItems = logs.filter((log) => {
    if (!log.must_revisit) return false;
    if (!log.last_revised_date) return true; // Never revised
    return new Date(log.last_revised_date) < sevenDaysAgo;
  });

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            CP Tracker
          </h1>
          <p className="text-zinc-400 text-sm">
            Steering metrics for your competitive programming journey.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/cp-tracker/library">
            <Button
              variant="outline"
              className="border-zinc-800 bg-black/20 text-zinc-300 hover:text-white hover:bg-white/5"
            >
              <List className="mr-2 h-4 w-4" />
              Library
            </Button>
          </Link>
          <Link href="/cp-tracker/log">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Log Problem
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Row 1: Metrics */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Col: Heatmap & Time */}
            <WeaknessHeatmap data={weaknessData} />
            <TimeAnalysisChart data={timeAnalysisData} />
          </div>
        </div>

        {/* Right Col: Accuracy & Queue */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <AccuracyGauge percentage={accuracyPercentage} />
          <RevisionQueue items={revisionItems} />
        </div>
      </div>
    </div>
  );
}
