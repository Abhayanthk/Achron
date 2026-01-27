"use client";

import PixelBlast from "@/components/PixelBlast";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Zap, Target, TrendingUp, AlertOctagon } from "lucide-react";
import { motion } from "framer-motion";

import { LevelProfileCard } from "@/components/journey/level-profile-card";
import { RealityAlignmentChart } from "@/components/journey/RealityAlignmentChart";
import { IdentityAlignmentScatter } from "@/components/journey/IdentityAlignmentScatter";
import { BurnoutEfficiencyScatter } from "@/components/journey/BurnoutEfficiencyScatter";

import { LogsAnalytics } from "@/components/analytics/logs-analytics";
import { TasksAnalytics } from "@/components/analytics/tasks-analytics";
import { TimerAnalytics } from "@/components/analytics/timer-analytics";
import { XpHistoryGraph } from "@/components/analytics/xp-line-graph";
import { ProjectStatusChart } from "@/components/analytics/project-status-chart";
import { ConfidenceMountain } from "@/components/non-negotiable/confidence-mountain";

import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export default function JourneyPage() {
  const {
    data: analysis,
    isLoading: isAnalysisLoading,
    isPending: isAnalysisPending,
    isError,
  } = useQuery({
    queryKey: ["analyze-day"],
    queryFn: async () => {
      const res = await axios.get("/api/analyze");
      return res.data;
    },
  });

  const { data: nonNegotiables = [] } = useQuery({
    queryKey: ["non-negotiables"],
    queryFn: async () => {
      const res = await axios.get("/api/non-negotiables");
      return res.data;
    },
  });

  const ErrorComponent = () => (
    <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6 border border-white/5 bg-zinc-950/30 rounded-xl">
      <AlertCircle className="w-10 h-10 text-red-500/50 mb-3" />
      <h3 className="text-lg font-medium text-zinc-300">Data Unavailable</h3>
      <p className="text-sm text-zinc-500 max-w-[250px]">
        We couldn't load this section right now.
      </p>
    </div>
  );

  // Extract latest metrics for KPI cards
  const dailyMetrics = analysis?.daily_metrics || [];
  const latestMetric =
    dailyMetrics.length > 0 ? dailyMetrics[dailyMetrics.length - 1] : {};

  // Calculate Avoidance Days count
  const avoidanceDaysCount = dailyMetrics.filter(
    (m: any) => m.is_avoidance_day,
  ).length;

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col">
      <div className="relative z-10 w-full max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <section className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white tracking-tight"
          >
            The Mirror
          </motion.h1>
          <LevelProfileCard />
        </section>

        {/* KPI Cards Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isAnalysisPending ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-white/10 bg-zinc-950/50 h-[100px] flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-4 w-24 bg-zinc-800" />
                    <Skeleton className="h-4 w-4 bg-zinc-800 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-16 bg-zinc-800" />
                  <Skeleton className="h-3 w-32 bg-zinc-800" />
                </div>
              ))}
            </>
          ) : isError ? (
            <div className="col-span-full">
              <ErrorComponent />
            </div>
          ) : (
            <>
              <KpiCard
                title="Execution Rate"
                value={`${(latestMetric.execution_rate * 100 || 0).toFixed(0)}%`}
                sub="Tasks Completed / Planned"
                icon={<Target className="w-4 h-4 text-blue-400" />}
              />
              <KpiCard
                title="Focus Ratio"
                value={`${latestMetric.focus_to_output_ratio || 0}`}
                sub="Mins Focus per Task"
                icon={<Zap className="w-4 h-4 text-amber-400" />}
              />
              <KpiCard
                title="XP Efficiency"
                value={`${latestMetric.xp_per_hour || 0}`}
                sub="XP per Focus Hour"
                icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
              />
              <KpiCard
                title="Avoidance Days"
                value={`${avoidanceDaysCount}`}
                sub="High Friction Days"
                icon={<AlertOctagon className="w-4 h-4 text-red-400" />}
                highlight={avoidanceDaysCount > 0}
              />
            </>
          )}
        </section>

        {/* Reality Alignment Section - Primary Visual */}
        <section className="space-y-6">
          {isAnalysisPending ? (
            <div className="w-full h-[400px] rounded-xl border border-white/10 bg-zinc-950/50 p-6">
              <Skeleton className="h-full w-full bg-zinc-800 rounded-lg" />
            </div>
          ) : isError ? (
            <ErrorComponent />
          ) : (
            <RealityAlignmentChart data={analysis?.reality_timeline || []} />
          )}
        </section>

        {/* Secondary Alignment Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isAnalysisPending ? (
            <>
              <div className="h-[300px] rounded-xl border border-white/10 bg-zinc-950/50 p-6">
                <Skeleton className="h-full w-full bg-zinc-800 rounded-lg" />
              </div>
              <div className="h-[300px] rounded-xl border border-white/10 bg-zinc-950/50 p-6">
                <Skeleton className="h-full w-full bg-zinc-800 rounded-lg" />
              </div>
            </>
          ) : isError ? (
            <div className="col-span-full">
              <ErrorComponent />
            </div>
          ) : (
            <>
              <IdentityAlignmentScatter
                data={analysis?.identity_scatter || []}
              />
              <BurnoutEfficiencyScatter data={analysis?.burnout_curve || []} />
            </>
          )}
        </section>

        <div className="w-full h-px bg-white/10 my-8" />
        <h2 className="text-2xl font-semibold text-white mb-4">
          Deep Dive Analytics
        </h2>

        {/* Core Analytics Grid (Existing) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90 hover:opacity-100 transition-opacity">
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
          <div className="lg:col-span-3 border border-white/10 p-4 rounded-xl">
            <ConfidenceMountain items={nonNegotiables} />
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, icon, highlight = false }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-xl border ${highlight ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-zinc-950/50"} backdrop-blur-sm`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-zinc-400 text-sm">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white font-mono">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{sub}</div>
    </motion.div>
  );
}
