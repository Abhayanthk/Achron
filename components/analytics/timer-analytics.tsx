"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

export function TimerAnalytics() {
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [unit, setUnit] = useState<"hours" | "minutes">("hours");

  const { data: analyticsData = [], isLoading } = useQuery({
    queryKey: ["analytics", "focus", range],
    queryFn: async () => {
      const res = await axios.get(`/api/analytics?type=timer&range=${range}`);
      return res.data.data;
    },
  });

  const data = analyticsData.map((d: any) => ({
    ...d,
    value: unit === "minutes" ? Number((d.hours * 60).toFixed(0)) : d.hours,
  }));

  return (
    <div className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Focus Depth</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            Time Dilation
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 rounded-lg p-0.5">
            {(["hours", "minutes"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                  unit === u
                    ? "bg-white text-black"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {u === "hours" ? "HR" : "MIN"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 rounded-lg p-0.5">
            {(["week", "month", "year"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                  range === r
                    ? "bg-white text-black"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[250px] w-full">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
            Loading...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                }}
                cursor={{ fill: "#27272a" }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                fill="#3b82f6"
                minPointSize={2}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
