import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Helper to generate the last 52 weeks of dates (skeleton)
const generateDates = () => {
  const dates = [];
  const today = new Date();
  const daysToGenerate = 52 * 7; // 364 days

  // Start from today and go backwards to build chronological list
  for (let i = daysToGenerate - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
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

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function XPHeatmap() {
  const [hoveredDay, setHoveredDay] = useState<{
    date: Date;
    intensity: number;
    xp: number;
  } | null>(null);

  // Fetch Real Data
  const { data: xpData = [] } = useQuery({
    queryKey: ["analytics", "heatmap"],
    queryFn: async () => {
      const res = await axios.get("/api/analytics?range=heatmap&type=xp");
      return res.data.data; // Array of { date: "YYYY-MM-DD", amount: number }
    },
  });

  // Normalize API data for fast lookup
  const xpMap = new Map<string, number>();
  xpData.forEach((item: any) => {
    xpMap.set(item.date, item.amount);
  });

  // Build the grid data
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

  // Group by weeks
  const weeks: { date: Date; intensity: number; xp: number }[][] = [];
  for (let i = 0; i < gridData.length; i += 7) {
    weeks.push(gridData.slice(i, i + 7));
  }
  return (
    <div className="w-full h-full flex flex-col bg-black/40 border border-white/5 rounded-xl p-4 backdrop-blur-sm">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white tracking-tight">
            XP Constellation
          </span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
            Yearly Activity
          </span>
        </div>

        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "size-2 rounded-sm",
                INTENSITY_STYLES[level as keyof typeof INTENSITY_STYLES]
              )}
            />
          ))}
        </div>
      </div>

      <div className="relative flex-1 w-full flex gap-2 overflow-hidden">
        {/* The Grid - Full Width Scrollable Container */}
        <div className="flex-1 w-full overflow-hidden hover:overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 pb-2">
          <div className="flex w-full justify-between gap-[2px]">
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-[2px]">
                {week.map((day, dIndex) => (
                  <Popover key={`${wIndex}-${dIndex}`}>
                    <PopoverTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.2, zIndex: 10 }}
                        className={cn(
                          "size-2.5 rounded-[1px] cursor-pointer transition-colors duration-200",
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
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-blue-400">
                          {day.xp === 0 ? "No activity" : `${day.xp} XP Gained`}
                        </span>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
