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

interface WeaknessHeatmapProps {
  data: { category: string; count: number }[];
}

export function WeaknessHeatmap({ data }: WeaknessHeatmapProps) {
  // Sort data by count descending
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="h-[300px] w-full bg-zinc-900/50 rounded-xl border border-white/5 p-4">
      <h3 className="text-zinc-400 text-sm font-medium mb-4">
        Weakness Frequency
      </h3>
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
            dataKey="category"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            width={120}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              borderColor: "rgba(255,255,255,0.1)",
              color: "#e4e4e7",
            }}
            itemStyle={{ color: "#e4e4e7" }}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  index === 0
                    ? "#ef4444" // Top weakness - Red
                    : index < 3
                      ? "#f97316" // Top 3 - Orange
                      : "#3b82f6" // Others - Blue
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
