"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface WeaknessHeatmapProps {
  data: { category: string; count: number }[];
}

export function WeaknessHeatmap({ data }: WeaknessHeatmapProps) {
  // Use top 6 categories to keep radar clean
  const chartData = [...data].sort((a, b) => b.count - a.count).slice(0, 6);

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full bg-zinc-900/50 rounded-xl border border-white/5 p-4 flex items-center justify-center text-zinc-500">
        No failure data yet
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full bg-zinc-900/50 rounded-xl border border-white/5 p-4 flex flex-col relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-50" />

      <h3 className="text-zinc-400 text-sm font-medium mb-2 z-10">
        Weakness Radar
      </h3>

      <div className="flex-1 w-full min-h-0 z-10">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="rgba(255,255,255,0.05)" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, "auto"]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Failures"
              dataKey="count"
              stroke="#ef4444"
              strokeWidth={2}
              fill="#ef4444"
              fillOpacity={0.3}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#e4e4e7",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#ef4444" }}
              cursor={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
