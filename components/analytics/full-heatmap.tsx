"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Helper to generate last 365 days dates
const generateDates = () => {
  const dates = [];
  const today = new Date();
  const daysToGenerate = 365;

  // Start from 365 days ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - daysToGenerate + 1);

  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const INTENSITY_STYLES = {
  0: "bg-[#1a1a1a]",
  1: "bg-blue-950/40 border-blue-900/20",
  2: "bg-blue-900/60 border-blue-800/30",
  3: "bg-blue-600/80 border-blue-500/40 shadow-[0_0_8px_rgba(37,99,235,0.4)]",
  4: "bg-blue-500 border-blue-400/50 shadow-[0_0_12px_rgba(59,130,246,0.6)]",
};

export function FullYearHeatmap() {
  const [hoveredDay, setHoveredDay] = useState<{
    date: Date;
    intensity: number;
    xp: number;
  } | null>(null);

  const { data: xpData = [] } = useQuery({
    queryKey: ["analytics", "xp", "heatmap"],
    queryFn: async () => {
      const res = await axios.get("/api/analytics?type=xp&range=heatmap");
      return res.data.data;
    },
  });
  //   console.log(xpData);
  // Normalize API data
  const xpMap = new Map<string, number>();
  xpData.forEach((item: any) => {
    xpMap.set(item.date, item.amount);
  });

  const skeletonDates = generateDates();
  const gridData = skeletonDates.map((date) => {
    const dateStr = date.toISOString().split("T")[0];
    const xp = xpMap.get(dateStr) || 0;

    let intensity = 0;
    if (xp > 1000) intensity = 4;
    else if (xp > 500) intensity = 3;
    else if (xp > 250) intensity = 2;
    else if (xp > 0) intensity = 1;

    return { date, intensity, xp };
  });

  // Group by weeks for vertical columns layout (GitHub style)
  // Grid is cols(weeks) x rows(days 0-6).
  // We need to verify the first day of the generated range to align Mon-Sun properly if needed.
  // Actually, standard contribution graphs are Columns(Weeks) x Rows(Days).

  const weeks: { date: Date; intensity: number; xp: number }[][] = [];
  let currentWeek: any[] = [];

  // Padding for start: if first date is not Sunday (or Monday depending on start), pad with nulls?
  // Let's stick to simple chunks of 7 for now, or use date-fns to be precise.
  // To keep it "sexy" and simple, plain chunks usually work if we don't care about strict alignment to "Monday" rows.
  // But for a true GitHub style, row 0 is Mon/Sun.
  // Let's assume chunks of 7 is fine for the "Artistic" vibe.

  for (let i = 0; i < gridData.length; i += 7) {
    weeks.push(gridData.slice(i, i + 7));
  }

  return (
    <div className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Focus Constellation</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            365 Days of Impact
          </p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "size-3 rounded-sm",
                INTENSITY_STYLES[level as keyof typeof INTENSITY_STYLES]
              )}
            />
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="flex gap-[3px] min-w-max">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dIndex) => (
                <Popover key={`${wIndex}-${dIndex}`}>
                  <PopoverTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.3, zIndex: 10 }}
                      className={cn(
                        "size-3 rounded-[1px] cursor-pointer transition-all duration-200",
                        INTENSITY_STYLES[
                          day.intensity as keyof typeof INTENSITY_STYLES
                        ]
                      )}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2 bg-zinc-950 border-zinc-800 text-zinc-400 text-xs font-mono shadow-xl">
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-200 font-bold">
                        {day.date.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-blue-400">{day.xp} XP</span>
                    </div>
                  </PopoverContent>
                </Popover>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
