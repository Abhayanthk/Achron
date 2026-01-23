"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";

interface TimelineData {
  date: string;
  normalized_execution: number;
  normalized_xp: number;
  normalized_sentiment: number;
  raw_execution: number;
  raw_xp: number;
  raw_sentiment: number;
}

interface RealityAlignmentChartProps {
  data: TimelineData[];
}

export function RealityAlignmentChart({ data }: RealityAlignmentChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      dateFormatted: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-white/10 rounded-xl bg-zinc-950/30">
        <p className="text-zinc-500">Not enough data for timeline</p>
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
          Reality Alignment Timeline
        </h3>
        <p className="text-xs text-zinc-400">
          Convergence of Execution, XP Efficiency, and Sentiment.
        </p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="dateFormatted"
              stroke="#52525b"
              tick={{ fill: "#71717a", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="#52525b"
              tick={{ fill: "#71717a", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 1]}
              hide={true}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#09090b",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
              itemStyle={{ fontSize: "12px" }}
              formatter={(value: number, name: string, props: any) => {
                const rawKey =
                  name === "Execution"
                    ? "raw_execution"
                    : name === "Efficiency"
                      ? "raw_xp"
                      : "raw_sentiment";
                const rawVal = props.payload[rawKey];

                if (name === "Execution")
                  return [`${(rawVal * 100).toFixed(0)}%`, name];
                if (name === "Efficiency")
                  return [`${rawVal.toFixed(1)} XP/hr`, name];
                return [rawVal.toFixed(2), name];
              }}
            />
            <Line
              type="monotone"
              dataKey="normalized_execution"
              name="Execution"
              stroke="#3b82f6" // blue-500
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6" }}
            />
            <Line
              type="monotone"
              dataKey="normalized_xp"
              name="Efficiency"
              stroke="#10b981" // emerald-500
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
            />
            <Line
              type="monotone"
              dataKey="normalized_sentiment"
              name="Sentiment"
              stroke="#8b5cf6" // violet-500
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#8b5cf6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 mt-4 justify-center">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-blue-500" /> Execution
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500" /> Efficiency
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-violet-500" /> Sentiment
        </div>
      </div>
    </motion.div>
  );
}
