"use client";

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Line,
  ComposedChart,
} from "recharts";
import { motion } from "framer-motion";

interface BurnoutData {
  date: string;
  x_focus_hours: number;
  y_efficiency: number; // XP per hour
}

interface BurnoutEfficiencyScatterProps {
  data: BurnoutData[];
}

export function BurnoutEfficiencyScatter({
  data,
}: BurnoutEfficiencyScatterProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-white/10 rounded-xl bg-zinc-950/30">
        <p className="text-zinc-500">Not enough data for Burnout Curve</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl border border-white/10 bg-zinc-950/50 backdrop-blur-sm"
    >
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          Burnout Efficiency Curve
        </h3>
        <p className="text-xs text-zinc-400">
          Focus Hours vs. Output Quality (XP/Hr). Diminishing returns = Burnout.
        </p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              type="number"
              dataKey="x_focus_hours"
              name="Focus Hours"
              unit="h"
              tick={{ fill: "#71717a", fontSize: 10 }}
              stroke="#52525b"
            />
            <YAxis
              type="number"
              dataKey="y_efficiency"
              name="XP/Hour"
              tick={{ fill: "#71717a", fontSize: 10 }}
              stroke="#52525b"
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "#09090b",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
              itemStyle={{ fontSize: "12px" }}
              formatter={(value: number, name: string) => {
                if (name === "Focus Hours")
                  return [`${value.toFixed(1)}h`, name];
                if (name === "XP/Hour") return [value.toFixed(0), name];
                return [value, name];
              }}
            />
            <Scatter name="Performance" data={data} fill="#f43f5e" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-zinc-500">
          Ideally, more focus hours should maintain or increase XP/Hour. A drop
          at high hours signals burnout.
        </p>
      </div>
    </motion.div>
  );
}
