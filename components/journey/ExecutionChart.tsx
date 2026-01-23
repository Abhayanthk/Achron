"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function ExecutionChart({ data }: { data: any[] }) {
  // Filter last 14 days for cleaner view, or use all data?
  // Let's use last 14 days by default for "recent" snapshot.
  const recentData = data.slice(-14);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 backdrop-blur-md h-[300px] flex flex-col"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Execution Gap</h3>
        <p className="text-zinc-400 text-sm">
          Planned (Gray) vs Completed (Blue)
        </p>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={recentData}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#71717a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#52525b"
              fontSize={12}
              tickFormatter={(val) => val.split("-").slice(1).join("/")}
            />
            <YAxis stroke="#52525b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                color: "#fff",
              }}
              itemStyle={{ color: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="tasks_planned"
              stroke="#71717a"
              fillOpacity={1}
              fill="url(#colorPlanned)"
              strokeDasharray="5 5"
            />
            <Area
              type="monotone"
              dataKey="tasks_completed"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorCompleted)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
