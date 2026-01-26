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
import SegmentedControlButton from "./segmentedControlButton";
import DateNavButtons from "./dateNavButtons";

export function TimerAnalytics() {
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [unit, setUnit] = useState<"hrs" | "mins">("hrs");
  const { date, goPrev, goNext, goToday } = useDateNavigator(range);
  const { data: analyticsData = [], isLoading } = useQuery({
    queryKey: ["analytics", "timer", range, date],
    queryFn: async () => {
      const res = await axios.get(
        `/api/analytics?type=timer&range=${range}&startDate=${date}`,
      );
      return res.data.data;
    },
  });

  const data = analyticsData.map((d: any) => ({
    ...d,
    value: unit === "mins" ? Number((d.hours * 60).toFixed(0)) : d.hours,
  }));

  return (
    <div className="w-full bg-zinc-950/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Focus Depth</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            Time Dilation
          </p>
        </div>
        <div className="flex gap-4">
          <SegmentedControlButton
            options={["hrs", "mins"]}
            value={unit}
            onChange={setUnit}
            size="sm"
          />
          <SegmentedControlButton
            options={["week", "month", "year"]}
            value={range}
            onChange={setRange}
            size="sm"
          />
        </div>
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
                  color: "#fff",
                }}
                cursor={{ fill: "#27272a" }}
              />
              <Bar
                name={unit === "hrs" ? "Hrs" : "Mins"}
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
