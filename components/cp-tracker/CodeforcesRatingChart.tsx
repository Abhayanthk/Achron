"use client";
import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { format } from "date-fns";
import { Target, Trophy, TrendingUp } from "lucide-react";

interface CFRatingData {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

interface CFChartProps {
  data: CFRatingData[];
  handle: string;
}

// Codeforces ranks per their official color scheme (approximate)
const getRankColor = (rating: number) => {
  if (rating >= 3000) return "text-red-500"; // Legendary Grandmaster
  if (rating >= 2600) return "text-red-400"; // International Grandmaster
  if (rating >= 2400) return "text-red-300"; // Grandmaster
  if (rating >= 2300) return "text-orange-400"; // International Master
  if (rating >= 2100) return "text-orange-300"; // Master
  if (rating >= 1900) return "text-violet-400"; // Candidate Master
  if (rating >= 1600) return "text-blue-400"; // Expert
  if (rating >= 1400) return "text-cyan-400"; // Specialist
  if (rating >= 1200) return "text-green-400"; // Pupil
  return "text-gray-400"; // Newbie
};

const getRankName = (rating: number) => {
  if (rating >= 3000) return "Legendary Grandmaster";
  if (rating >= 2600) return "International Grandmaster";
  if (rating >= 2400) return "Grandmaster";
  if (rating >= 2300) return "International Master";
  if (rating >= 2100) return "Master";
  if (rating >= 1900) return "Candidate Master";
  if (rating >= 1600) return "Expert";
  if (rating >= 1400) return "Specialist";
  if (rating >= 1200) return "Pupil";
  return "Newbie";
};

export function CodeforcesRatingChart({ data, handle }: CFChartProps) {
  // Format data for Recharts
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      date: new Date(d.ratingUpdateTimeSeconds * 1000),
      dateStr: format(new Date(d.ratingUpdateTimeSeconds * 1000), "MMM yyyy"),
      fullDateStr: format(
        new Date(d.ratingUpdateTimeSeconds * 1000),
        "MMM d, yyyy",
      ),
    }));
  }, [data]);

  const currentRating = data.length > 0 ? data[data.length - 1].newRating : 0;
  const maxRating =
    data.length > 0 ? Math.max(...data.map((d) => d.newRating)) : 0;

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="h-[350px] w-full bg-zinc-900/50 rounded-xl border border-white/5 flex flex-col mb-0 overflow-hidden">
      <div className="p-4 flex flex-row items-center justify-between border-b border-white/5 bg-black/20">
        <div>
          <h3 className="text-zinc-200 font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-indigo-400" />
            Codeforces Rating
          </h3>
          <p className="text-zinc-500 text-xs mt-1">
            Tracking handle:{" "}
            <span className="text-zinc-400 font-medium">{handle}</span>
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
              Current
            </span>
            <div className={`text-lg font-bold ${getRankColor(currentRating)}`}>
              {currentRating}
            </div>
          </div>
          <div className="flex flex-col items-end pl-4 border-l border-white/10">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
              Max
            </span>
            <div className={`text-lg font-bold ${getRankColor(maxRating)}`}>
              {maxRating}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full min-h-0 pt-4 pb-2 px-2 sm:px-6 relative">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(255,255,255,0.05)"
              />

              <XAxis
                dataKey="ratingUpdateTimeSeconds"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(val) =>
                  format(new Date(val * 1000), "MMM yyyy")
                }
                stroke="#52525b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />

              <YAxis
                domain={["dataMin - 100", "dataMax + 100"]}
                stroke="#52525b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={40}
              />

              <Tooltip
                cursor={{
                  stroke: "rgba(255,255,255,0.1)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    const diff = d.newRating - d.oldRating;
                    return (
                      <div className="bg-zinc-900 border border-white/10 p-3 rounded-lg shadow-xl shadow-black/50">
                        <p className="text-zinc-300 text-xs mb-2">
                          {d.fullDateStr}
                        </p>
                        <p className="text-white font-medium text-sm mb-1 max-w-[250px] truncate">
                          {d.contestName}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-lg font-bold ${getRankColor(
                              d.newRating,
                            )}`}
                          >
                            {d.newRating}
                          </span>
                          <span
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded font-medium",
                              diff >= 0
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400",
                            )}
                          >
                            {diff >= 0 ? "+" : ""}
                            {diff}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-xs mt-1">
                          Rank: {d.rank}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="newRating"
                stroke="#818cf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRating)"
                isAnimationActive={false}
                activeDot={{
                  r: 6,
                  fill: "#818cf8",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Ensure utility wrapper 'cn' isn't missing. Included below just in case.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
