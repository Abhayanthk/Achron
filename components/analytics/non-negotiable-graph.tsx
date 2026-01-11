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

export function NonNegotiableGraph() {
  const { data: nonNegoData = [], isLoading } = useQuery({
    queryKey: ["analytics", "non-negotiables"],
    queryFn: async () => {
      const res = await axios.get("/api/analytics?type=non_negotiable");
      return res.data.data;
    },
  });

  // Mock data fallback
  const data =
    nonNegoData.length > 0
      ? nonNegoData
      : [
          { day: "Mon", score: 85 },
          { day: "Tue", score: 90 },
          { day: "Wed", score: 60 },
          { day: "Thu", score: 100 },
          { day: "Fri", score: 95 },
          { day: "Sat", score: 80 },
          { day: "Sun", score: 90 },
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
          Non-Negotiables Consistency
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
              <Bar dataKey="score" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
