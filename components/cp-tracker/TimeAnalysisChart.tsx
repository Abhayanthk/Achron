"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TimeAnalysisChartProps {
  data: { pattern: string; avgTime: number }[];
}

export function TimeAnalysisChart({ data }: TimeAnalysisChartProps) {
  return (
    <div className="h-[300px] w-full bg-zinc-900/50 rounded-xl border border-white/5 p-4">
      <h3 className="text-zinc-400 text-sm font-medium mb-4">
        Avg. Time by Pattern (min)
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey="pattern"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            unit="m"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              borderColor: "rgba(255,255,255,0.1)",
              color: "#e4e4e7",
            }}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />
          <Bar dataKey="avgTime" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
