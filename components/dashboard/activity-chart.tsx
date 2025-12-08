"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { name: "Mon", completed: 4, missed: 1 },
  { name: "Tue", completed: 3, missed: 2 },
  { name: "Wed", completed: 7, missed: 0 },
  { name: "Thu", completed: 5, missed: 1 },
  { name: "Fri", completed: 6, missed: 1 },
  { name: "Sat", completed: 2, missed: 3 },
  { name: "Sun", completed: 4, missed: 0 },
]

export function ActivityChart() {
  const data = [
    { name: "Mon", focus: 4, goal: 6 },
    { name: "Tue", focus: 6.5, goal: 6 },
    { name: "Wed", focus: 3, goal: 6 },
    { name: "Thu", focus: 8, goal: 6 },
    { name: "Fri", focus: 5, goal: 6 },
    { name: "Sat", focus: 9, goal: 8 },
    { name: "Sun", focus: 2, goal: 4 },
  ]

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
            tickFormatter={(value) => `${value}h`} 
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
            dataKey="focus" 
            fill="#60a5fa" 
            radius={[4, 4, 0, 0]}
            barSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
