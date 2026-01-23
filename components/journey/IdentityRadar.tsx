"use client";

import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Info } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

interface IdentityAnalysis {
  drift_detected: boolean;
  current_identity: unknown;
  baseline_identity: unknown;
  recent_distribution: Record<string, number>;
  baseline_distribution: Record<string, number>;
}

export function IdentityRadar({ analysis }: { analysis: IdentityAnalysis }) {
  // Transform data for Recharts
  const allCategories = Array.from(
    new Set([
      ...Object.keys(analysis.recent_distribution),
      ...Object.keys(analysis.baseline_distribution),
    ]),
  );

  const data = allCategories.map((cat) => ({
    subject: cat,
    Recent: analysis.recent_distribution[cat] || 0,
    Baseline: analysis.baseline_distribution[cat] || 0,
    fullMark:
      Math.max(
        ...Object.values(analysis.recent_distribution),
        ...Object.values(analysis.baseline_distribution),
      ) * 1.2,
  }));

  // Sort by recent values to put dominant categories at top potentially?
  // Radar loops, so order matters less, but let's keep it somewhat somewhat organized?
  // Current order is random-ish dependent on set.

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 backdrop-blur-md h-[400px] flex flex-col"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            Identity Radar
            {analysis.drift_detected && (
              <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                Drift Detected
              </span>
            )}
          </h3>
          <p className="text-zinc-400 text-sm">
            Who you are becoming (Last 7d) vs Who you were (Last 30d).
          </p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, "auto"]}
              tick={false}
              axisLine={false}
            />

            <Radar
              name="Recent (7d)"
              dataKey="Recent"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="#8b5cf6"
              fillOpacity={0.3}
            />
            <Radar
              name="Baseline (30d)"
              dataKey="Baseline"
              stroke="#71717a"
              strokeWidth={2}
              fill="#71717a"
              fillOpacity={0.1}
            />
            <Legend wrapperStyle={{ color: "#fff" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {analysis.drift_detected && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-sm text-zinc-300">
          Your primary focus has shifted. Ensure this aligns with your long-term
          goals.
        </div>
      )}
    </motion.div>
  );
}
