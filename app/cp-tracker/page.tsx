import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WeaknessHeatmap } from "@/components/cp-tracker/WeaknessHeatmap";
import { StatusDistributionChart } from "@/components/cp-tracker/StatusDistributionChart";
import { TagPerformanceChart } from "@/components/cp-tracker/TagPerformanceChart";
import { AccuracyGauge } from "@/components/cp-tracker/AccuracyGauge";
import { RevisionQueue } from "@/components/cp-tracker/RevisionQueue";
import { CodeforcesRatingChart } from "@/components/cp-tracker/CodeforcesRatingChart";
import { Button } from "@/components/ui/button";
import { Plus, List, Trophy } from "lucide-react";
import Link from "next/link";
import { isRevisionDue } from "@/lib/revision";

// Codeforces API fetcher
async function getCodeforcesRating(handle: string) {
  try {
    const res = await fetch(
      `https://codeforces.com/api/user.rating?handle=${handle}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.status === "OK" ? data.result : [];
  } catch (error) {
    console.error("Failed to fetch Codeforces rating:", error);
    return [];
  }
}

export default async function CPTrackerPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch CF Rating Data for 'harly24'
  const cfHandle = "harly24";
  const cfRatingHistory = await getCodeforcesRating(cfHandle);

  // Fetch DB Data
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

  // 2. Status Distribution Data
  const statusCounts: Record<string, number> = {};
  logs.forEach((log) => {
    statusCounts[log.solve_status_type] =
      (statusCounts[log.solve_status_type] || 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  // 3. Tag Performance Data (Frequency)
  const tagCounts: Record<string, number> = {};
  logs.forEach((log) => {
    log.tags.forEach((tag) => {
      tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
    });
  });
  const tagData = Object.entries(tagCounts).map(([tag, count]) => ({
    tag,
    count,
  }));

  // 4. Accuracy Data (Self-Solved Rate)
  const selfSolvedCount = logs.filter(
    (log) => log.idea_source === "Self",
  ).length;
  const accuracyPercentage =
    logs.length > 0 ? (selfSolvedCount / logs.length) * 100 : 0;

  // 5. Revision Queue — Spaced Repetition
  const revisionItems = logs.filter((log) => {
    if (!log.must_revisit) return false;
    return isRevisionDue(log.last_revised_date, log.rev_level, log.created_at);
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
          {cfRatingHistory.length > 0 && (
            <div className="grid grid-cols-1">
              <CodeforcesRatingChart data={cfRatingHistory} handle={cfHandle} />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatusDistributionChart data={statusData} />
            <TagPerformanceChart data={tagData} />
          </div>
          <div className="grid grid-cols-1">
            <WeaknessHeatmap data={weaknessData} />
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
