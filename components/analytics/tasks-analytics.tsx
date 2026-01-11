"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export function TasksAnalytics() {
  const [range, setRange] = useState<"week" | "month" | "year">("week");

  const { data: tasksData = [], isLoading } = useQuery({
    queryKey: ["analytics", "tasks", range],
    queryFn: async () => {
      const res = await axios.get(`/api/analytics?type=tasks&range=${range}`);
      return res.data.data;
    },
  });

  return (
    <div className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Task Velocity</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            Execution Rate
          </p>
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

      <div className="h-[250px] w-full">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
            Loading...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tasksData}>
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
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#a1a1aa"
                strokeWidth={2}
                dot={false}
                name="Created"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false} // Smooth line
                activeDot={{ r: 4 }}
                name="Completed"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
