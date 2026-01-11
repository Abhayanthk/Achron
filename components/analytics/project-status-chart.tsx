"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function ProjectStatusChart() {
  const { data: projectData, isLoading } = useQuery({
    queryKey: ["projects", "status-distribution"],
    queryFn: async () => {
      const res = await axios.get("/api/projects/stats"); // We might need to ensure this endpoint exists
      return res.data;
    },
  });

  // Mock data fallback
  const data = projectData || [
    { name: "Completed", value: 12, color: "#10b981" }, // Emerald
    { name: "Active", value: 5, color: "#3b82f6" }, // Blue
    { name: "Paused", value: 3, color: "#f59e0b" }, // Amber
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
          Project Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
