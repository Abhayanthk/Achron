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
  ReferenceArea,
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
      dateFormatted: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
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

  console.log(formattedData);

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
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
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

            {/* Quadrant Guidelines */}
            <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
            <ReferenceLine y={0.5} stroke="rgba(255,255,255,0.2)" />

            {/* Quadrant Labels */}
            <ReferenceArea
              x1={-1}
              x2={0}
              y1={0.5}
              y2={1}
              fillOpacity={0}
              label={{
                value: "Stoic (Low S / High E)",
                position: "center",
                fill: "#fff",
                fontSize: 10,
              }}
            />
            <ReferenceArea
              x1={0}
              x2={1}
              y1={0.5}
              y2={1}
              fillOpacity={0}
              label={{
                value: "Aligned (High S / High E)",
                position: "center",
                fill: "#fff",
                fontSize: 10,
              }}
            />
            <ReferenceArea
              x1={-1}
              x2={0}
              y1={0}
              y2={0.5}
              fillOpacity={0}
              label={{
                value: "Drifting (Low S / Low E)",
                position: "center",
                fill: "#fff",
                fontSize: 10,
              }}
            />
            <ReferenceArea
              x1={0}
              x2={1}
              y1={0}
              y2={0.5}
              fillOpacity={0}
              label={{
                value: "Delusional (High S / Low E)",
                position: "center",
                fill: "#fff",
                fontSize: 10,
              }}
            />

            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-zinc-950 border border-white/10 rounded-lg p-3 shadow-xl min-w-[120px]">
                      <p className="text-white font-medium mb-2 text-xs border-b border-white/10 pb-1">
                        {data.dateFormatted}
                      </p>
                      {payload.map((p: any) => (
                        <div
                          key={p.name}
                          className="text-xs text-zinc-400 flex justify-between gap-4 mb-1"
                        >
                          <span className="text-white">
                            {p.name === "Sentiment"
                              ? Number(p.value).toFixed(2)
                              : p.name === "Execution"
                                ? `${(Number(p.value) * 100).toFixed(0)}%`
                                : p.value}
                          </span>
                          <span className="text-zinc-500">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Days" data={formattedData} fill="#fff">
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
