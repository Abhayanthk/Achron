"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function HabitGraph() {
  const [range, setRange] = useState<"week" | "month" | "year">("week");

  const { data: habitData = [], isLoading } = useQuery({
    queryKey: ["analytics", "habits-graph", range],
    queryFn: async () => {
      // Placeholder for an internal stats API or calculate from local
      // const res = await axios.get("/api/analytics/habits")
      // return res.data.data
      return [];
    },
  });

  // Mock data fallback
  const data =
    habitData.length > 0
      ? habitData
      : [
          { day: "Mon", active: 5, completed: 4 },
          { day: "Tue", active: 5, completed: 5 },
          { day: "Wed", active: 6, completed: 3 },
          { day: "Thu", active: 6, completed: 6 },
          { day: "Fri", active: 6, completed: 5 },
          { day: "Sat", active: 6, completed: 4 },
          { day: "Sun", active: 6, completed: 6 },
        ];

  if (isLoading) {
    return (
      <Card className="bg-zinc-900/50 border-white/5">
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="animate-spin text-zinc-500" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-white/5 h-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white">
          Habit Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#333"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar
                dataKey="completed"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="Completed"
              />
              {/* Could add stacked bar for skipped/pending if we want */}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
