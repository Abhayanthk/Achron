import { useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import SegmentedControlButton from "./segmentedControlButton";
import DateNavButtons from "./dateNavButtons";
import { useDateNavigator } from "@/hooks/useDateNavigation";

type Range = "week" | "month" | "year";

export function XpHistoryGraph() {
  const [range, setRange] = useState<Range>("week");
  const { date, goPrev, goNext, goToday } = useDateNavigator(range);
  const { data: xpHistory = [], isLoading } = useQuery({
    queryKey: ["analytics", "xp-history", range, date],
    queryFn: async () => {
      const res = await axios.get(
        `/api/analytics?type=xp&range=${range}&startDate=${date}`,
      );
      return res.data.data;
    },
  });

  const ranges: { label: string; value: Range }[] = [
    { label: "1W", value: "week" },
    { label: "1M", value: "month" },
    { label: "1Y", value: "year" },
  ];

  if (isLoading) {
    return (
      <Card className="bg-zinc-900/50 border-white/5">
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin text-zinc-500" />
        </div>
      </Card>
    );
  }

  // Fallback if empty to avoid broken chart
  const data = xpHistory.length > 0 ? xpHistory : [];

  return (
    <Card className="bg-zinc-950/50 border-white/10 h-full backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold text-white">
          XP History
        </CardTitle>
        <SegmentedControlButton
          options={["week", "month", "year"]}
          value={range}
          onChange={setRange}
          size="sm"
        />
      </CardHeader>
      <CardDescription className="pr-6">
        <DateNavButtons
          handleDateChangeLeft={goPrev}
          handleDateChangeRight={goNext}
          handleToday={goToday}
        />
      </CardDescription>
      <CardContent>
        <div className="h-[250px] w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#333"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
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
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.2)" }}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 4 }}
                  activeDot={{ r: 6, fill: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-zinc-500 text-xs">
              <p>No XP history for this period.</p>
              <p>Go crush some tasks.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
