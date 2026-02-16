"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface AccuracyGaugeProps {
  percentage: number; // 0-100
}

export function AccuracyGauge({ percentage }: AccuracyGaugeProps) {
  const roundedPercentage = Math.round(percentage);

  const data = [
    { name: "Self Solved", value: roundedPercentage },
    { name: "Hint Needed", value: 100 - roundedPercentage },
  ];

  const COLORS = ["#10b981", "#27272a"]; // Emerald for success, Zinc-800 for remainder

  return (
    <div className="h-[200px] w-full bg-zinc-900/50 rounded-xl border border-white/5 p-4 flex flex-col items-center justify-center relative">
      <h3 className="absolute top-4 left-4 text-zinc-400 text-sm font-medium">
        Self-Sufficiency
      </h3>

      <div className="h-[120px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="absolute bottom-4 flex flex-col items-center">
        <span className="text-3xl font-bold text-white">
          {roundedPercentage}%
        </span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">
          Idea Source = Self
        </span>
      </div>
    </div>
  );
}
