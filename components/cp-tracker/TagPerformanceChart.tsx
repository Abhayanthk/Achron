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
  Cell,
} from "recharts";

interface TagPerformanceChartProps {
  data: { tag: string; count: number }[];
}

export function TagPerformanceChart({ data }: TagPerformanceChartProps) {
  // Take top 8 tags
  const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="h-[300px] w-full bg-zinc-900/50 rounded-xl border border-white/5 p-4 flex flex-col">
      <h3 className="text-zinc-400 text-sm font-medium mb-4">
        Top Tags Practiced
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              horizontal={false}
            />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="tag"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              width={100}
              interval={0}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#e4e4e7",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#e4e4e7" }}
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index < 3
                      ? "#8b5cf6" // Top 3 - Violet
                      : "#6366f1" // Others - Indigo
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
