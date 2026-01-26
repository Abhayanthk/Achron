"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useState, useMemo } from "react";

import SegmentedControlButton from "../analytics/segmentedControlButton";
import DateNavButtons from "../analytics/dateNavButtons";
import { useDateNavigator } from "@/hooks/useDateNavigation";

export function ActivityChart() {
  const [unit, setUnit] = useState<"hrs" | "mins">("hrs");
  const { date, goPrev, goNext, goToday } = useDateNavigator("week");
  const { data: rawData = [], isPending } = useQuery({
    queryKey: ["analytics", "week", date],
    queryFn: async () => {
      const res = await axios.get(
        `/api/analytics?range=week&type=timer&startDate=${date}`,
      );
      return res.data.data;
    },
  });

  const chartData = useMemo(() => {
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return weekDays.map((day) => {
      const found = rawData.find((d: any) => d.name === day);
      const hours = found ? found.hours : 0;
      return {
        name: day,
        value: unit === "mins" ? Number((hours * 60).toFixed(0)) : hours,
        hours: hours,
        goal: unit === "mins" ? 6 * 60 : 6,
      };
    });
  }, [rawData, unit]);

  const totalFocus = chartData.reduce(
    (acc: any, curr: any) =>
      acc + (unit === "mins" ? curr.hours * 60 : curr.hours),
    0,
  );

  if (isPending) {
    return (
      <div className="h-[200px] w-full mt-4 flex items-end justify-between gap-2 p-2 animate-pulse">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="w-full bg-zinc-800 rounded-t-sm"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
          ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full justify-between min-h-[200px] ">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white mt-1">
            {totalFocus.toFixed(unit === "hrs" ? 1 : 0)}
            {unit === "hrs" ? "h" : "m"}
          </p>
          <p className="text-xs text-zinc-500">Focus time this week</p>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <DateNavButtons
            handleDateChangeLeft={goPrev}
            handleDateChangeRight={goNext}
            handleToday={goToday}
            className="mb-0"
          />
          <SegmentedControlButton
            options={["hrs", "mins"]}
            value={unit}
            onChange={setUnit}
            size="sm"
          />
        </div>
      </div>
      <div className="flex-1 -mb-2 mt-4 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            key={unit}
            data={chartData}
            margin={{ top: 20, right: 0, left: -20, bottom: 24 }}
          >
            <XAxis
              dataKey="name"
              stroke="#52525b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#52525b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}${unit === "hrs" ? "h" : "m"}`}
            />
            <Tooltip
              cursor={{ fill: "#ffffff", opacity: 0.05 }}
              contentStyle={{
                backgroundColor: "#09090b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#e4e4e7",
              }}
              itemStyle={{ color: "#e4e4e7" }}
            />
            <Bar
              name={unit === "hrs" ? "Hrs" : "Mins"}
              dataKey="value"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
