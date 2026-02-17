"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface StatusDistributionChartProps {
  data: { status: string; count: number }[];
}

const COLORS: Record<string, string> = {
  "Solved Clean": "#10b981", // Emerald-500
  "Solved with Hint": "#3b82f6", // Blue-500
  "Solved after Editorial": "#eab308", // Yellow-500
  Partial: "#f97316", // Orange-500
  Failed: "#ef4444", // Red-500
};

export function StatusDistributionChart({
  data,
}: StatusDistributionChartProps) {
  // Filter out zero counts to avoid empty segments
  const activeData = data.filter((d) => d.count > 0);

  return (
    <div className="h-[300px] w-full bg-zinc-900/50 rounded-xl border border-white/5 p-4 flex flex-col">
      <h3 className="text-zinc-400 text-sm font-medium mb-4">
        Solve Status Distribution
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activeData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="count"
              stroke="none"
            >
              {activeData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.status] || "#71717a"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#e4e4e7",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              itemStyle={{ color: "#e4e4e7" }}
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value, entry: any) => (
                <span className="text-zinc-400 text-xs ml-1">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
