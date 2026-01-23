"use client";

import PixelBlast from "@/components/PixelBlast";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Zap, Target, TrendingUp, AlertOctagon } from "lucide-react";
import { motion } from "framer-motion";

import { LevelProfileCard } from "@/components/journey/level-profile-card";
import { BurnoutIndicator } from "@/components/journey/BurnoutIndicator";
import { IdentityShift } from "@/components/journey/IdentityShift";
import { ExecutionChart } from "@/components/journey/ExecutionChart";

import { LogsAnalytics } from "@/components/analytics/logs-analytics";
import { TasksAnalytics } from "@/components/analytics/tasks-analytics";
import { TimerAnalytics } from "@/components/analytics/timer-analytics";
import { XpHistoryGraph } from "@/components/analytics/xp-line-graph";
import { ProjectStatusChart } from "@/components/analytics/project-status-chart";
import { ConfidenceMountain } from "@/components/non-negotiable/confidence-mountain";

export default function JourneyPage() {
  const { data: analysis, isLoading: isAnalysisLoading } = useQuery({
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

  if (isAnalysisLoading) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

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
        </section>

        {/* Psychological Signals Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6 flex flex-col">
            <BurnoutIndicator analysis={analysis.burnout_analysis} />
            <div className="flex-1">
              <IdentityShift analysis={analysis.identity_analysis} />
            </div>
          </div>
          <div className="lg:col-span-2 flex flex-col gap-6">
            <ExecutionChart data={dailyMetrics} />
            <ConfidenceMountain items={nonNegotiables} />
          </div>
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
