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
import { useDateNavigator } from "@/hooks/useDateNavigation";
import DateNavButtons from "./dateNavButtons";
import SegmentedControlButton from "./segmentedControlButton";
export function LogsAnalytics() {
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const { date, goPrev, goNext, goToday } = useDateNavigator(range);
  const { data: logsData = [], isLoading } = useQuery({
    queryKey: ["analytics", "logs", range, date],
    queryFn: async () => {
      const res = await axios.get(
        `/api/analytics?type=logs&range=${range}&startDate=${date}`,
      );
      return res.data.data;
    },
  });

  return (
    <div className="w-full bg-zinc-950/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-white">Log Frequency</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            Consistency Checker
          </p>
        </div>
        <SegmentedControlButton
          options={["week", "month", "year"]}
          value={range}
          onChange={setRange}
        />
      </div>
      <DateNavButtons
        handleDateChangeLeft={goPrev}
        handleDateChangeRight={goNext}
        handleToday={goToday}
      />

      <div className="h-[250px] w-full">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
            Loading...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={logsData}>
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
                  color: "#fff",
                }}
                //     by not giving itemStyle it will take the default color of the tooltip(I.e color from the Bar in this case)
                cursor={{ fill: "#27272a" }}
              />
              <Bar
                dataKey="value"
                name="Frequency"
                radius={[4, 4, 0, 0]}
                fill="#e11d48" // Rose color like the "Initiate" level
                minPointSize={2}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
