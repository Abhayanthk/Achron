"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { useState } from "react"
import { cn } from "@/lib/utils"

export function ActivityChart() {
  const [unit, setUnit] = useState<"hours" | "minutes">("hours")

  const { data: analyticsData = [], isLoading } = useQuery({
    queryKey: ['analytics', 'week'],
    queryFn: async () => {
        const res = await axios.get('/api/analytics?range=week');
        return res.data.data;
    }
  });

  // Ensure we have data for all 7 days
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  
  const filledData = weekDays.map(day => {
      const found = analyticsData.find((d: any) => d.name === day)
      const hours = found ? found.hours : 0
      return {
          name: day,
          value: unit === 'minutes' ? Number((hours * 60).toFixed(0)) : hours,
          hours: hours, // keep raw for reference if needed
          goal: unit === 'minutes' ? 6 * 60 : 6
      }
  })

  if (isLoading) {
      return (
          <div className="h-[200px] w-full mt-4 flex items-end justify-between gap-2 p-2 animate-pulse">
              {Array(7).fill(0).map((_, i) => (
                  <div key={i} className="w-full bg-zinc-800 rounded-t-sm" style={{ height: `${20 + Math.random() * 60}%`}} />
              ))}
          </div>
      )
  }

  return (
    <div className="w-full mt-4 flex flex-col gap-2">
      <div className="flex items-center justify-between px-2">
         <h4 className="text-sm font-medium text-zinc-400">Activity</h4>
         <div className="flex bg-zinc-900 border border-white/5 rounded-md p-0.5">
            {(['hours', 'minutes'] as const).map((u) => (
                <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={cn(
                        "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase transition-all",
                        unit === u ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    {u === 'hours' ? 'HR' : 'MIN'}
                </button>
            ))}
         </div>
      </div>
      <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filledData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
            tickFormatter={(value) => `${value}${unit === 'hours' ? 'h' : 'm'}`} 
          />
          <Tooltip
            cursor={{ fill: '#ffffff', opacity: 0.05 }}
            contentStyle={{
              backgroundColor: "#09090b",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#e4e4e7",
            }}
            itemStyle={{ color: "#e4e4e7" }}
          />
          <Bar 
            dataKey="value" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]}
            barSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
