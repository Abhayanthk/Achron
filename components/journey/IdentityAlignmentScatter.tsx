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
  ReferenceLine,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

interface IdentityData {
  date: string;
  x_sentiment: number; // -1 to 1
  y_execution: number; // 0 to 1
  status: string; // Stoic, Aligned, Delusional, Drifting
}

interface IdentityAlignmentScatterProps {
  data: IdentityData[];
}

export function IdentityAlignmentScatter({
  data,
}: IdentityAlignmentScatterProps) {
  // Sort by date to highlight recent ones? Or just plot all.
  // We can pass a prop to highlight specific points if needed.

  const formattedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      fillColor:
        d.status === "Aligned"
          ? "#22c55e" // green-500
          : d.status === "Stoic"
            ? "#3b82f6" // blue-500
            : d.status === "Delusional"
              ? "#eab308" // yellow-500
              : "#ef4444", // red-500
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-white/10 rounded-xl bg-zinc-950/30">
        <p className="text-zinc-500">Not enough data for Identity Alignment</p>
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
          Identity Alignment
        </h3>
        <p className="text-xs text-zinc-400">
          Emotional state vs. Actual Execution.
        </p>
      </div>

      <div className="h-[300px] w-full relative">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none opacity-20">
          <div className="border-r border-b border-white flex justify-center items-center text-xs text-zinc-500">
            Drifting (Low S / Low E)
          </div>
          <div className="border-b border-white flex justify-center items-center text-xs text-zinc-500">
            Delusional (High S / Low E)
          </div>
          <div className="border-r border-white flex justify-center items-center text-xs text-zinc-500">
            Stoic (Low S / High E)
          </div>
          <div className="flex justify-center items-center text-xs text-zinc-500">
            Aligned (High S / High E)
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              type="number"
              dataKey="x_sentiment"
              name="Sentiment"
              domain={[-1, 1]}
              tick={{ fill: "#71717a", fontSize: 10 }}
              stroke="#52525b"
            />
            <YAxis
              type="number"
              dataKey="y_execution"
              name="Execution"
              domain={[0, 1]}
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
              formatter={(value: number, name: string, props: any) => {
                if (name === "Sentiment") return [value.toFixed(2), name];
                if (name === "Execution")
                  return [`${(value * 100).toFixed(0)}%`, name];
                return [value, name];
              }}
              labelFormatter={() => ""}
            />
            <Scatter name="Days" data={formattedData} fill="#8884d8">
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fillColor} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-green-500" /> Aligned
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-blue-500" /> Stoic
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-yellow-500" /> Delusional
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-red-500" /> Drifting
        </div>
      </div>
    </motion.div>
  );
}
