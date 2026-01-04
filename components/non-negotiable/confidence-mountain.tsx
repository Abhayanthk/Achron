"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { motion } from "framer-motion"
import { useMemo } from "react"
import { NonNegotiable } from "@/app/non-negotiables/page"

interface ConfidenceMountainProps {
    items: NonNegotiable[]
}

export function ConfidenceMountain({ items }: ConfidenceMountainProps) {
    const data = useMemo(() => {
        if (items.length === 0) {
            const days = Array.from({ length: 30 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - (29 - i))
                return {
                     date: d.toDateString(),
                     score: 0,
                     day: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                }
            })
            return days
        }

        const earliestStart = items.reduce((earliest, item) => {
            const itemDate = new Date(item.createdAt)
            return itemDate < earliest ? itemDate : earliest
        }, new Date())
        earliestStart.setHours(0, 0, 0, 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        let simulationDate = new Date(earliestStart)
        let currentScore = 0 
        
        const fullHistory: { date: string, score: number, day: string, timestamp: number }[] = []

        while (simulationDate <= today) {
            const dateStr = simulationDate.toDateString()
            
            // Check performance against items that existed on that day
            // Simplified: We assume if you have non-negotiables now, you are accountable for them.
            // But to be fair, usually we only count items created before or on that date.
            const activeItems = items.filter(i => new Date(i.createdAt).setHours(0,0,0,0) <= simulationDate.getTime())
            
            let change = 0
            
            if (activeItems.length > 0) {
                const completedCount = activeItems.filter(item => 
                    item.completedDates.some(d => new Date(d).toDateString() === dateStr)
                ).length

                const dailyPerformance = completedCount / activeItems.length

                if (dailyPerformance === 1) change = 5
                else if (dailyPerformance >= 0.5) change = 2
                else if (dailyPerformance > 0) change = -2
                else change = -5
            } 
            // If no active items (before you started), no change.

            currentScore = Math.max(0, Math.min(100, currentScore + change))
            
            fullHistory.push({
                date: dateStr,
                score: currentScore,
                day: simulationDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                timestamp: simulationDate.getTime()
            })

            simulationDate.setDate(simulationDate.getDate() + 1)
        }

        // Return last 30 days
        const last30Days = []
        for (let i = 29; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            d.setHours(0, 0, 0, 0)
            
            const existingEntry = fullHistory.find(h => h.timestamp === d.getTime())
            
            if (existingEntry) {
                last30Days.push(existingEntry)
            } else {
                last30Days.push({
                    date: d.toDateString(),
                    score: 0,
                    day: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                    timestamp: d.getTime()
                })
            }
        }
        
        return last30Days

    }, [items])

    const currentScore = data[data.length - 1]?.score || 0

    return (
        <div className="w-full h-[300px] mb-8 relative group">
            <div className="absolute inset-0 bg-linear-to-t from-emerald-900/10 to-transparent pointer-events-none" />
            
            {/* Header Stats */}
            <div className="absolute top-0 left-0 z-10 p-4">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col"
                >
                    <span className="text-zinc-500 text-xs uppercase tracking-widest font-medium">Confidence Score</span>
                    <span className="text-4xl font-bold text-white tracking-tight flex items-baseline gap-2">
                        {Math.round(currentScore)}
                        <span className="text-sm font-normal text-emerald-500">
                             {currentScore >= 80 ? "PEAK PERFORMANCE" : 
                              currentScore >= 50 ? "CLIMBING" : "RECOVERING"}
                        </span>
                    </span>
                </motion.div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="mountainGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                    <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#52525b', fontSize: 10 }} 
                        interval={6}
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg shadow-xl">
                                        <p className="text-zinc-400 text-xs mb-1">{payload[0].payload.day}</p>
                                        <p className="text-emerald-400 font-bold text-lg">
                                            {payload[0].value}
                                        </p>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fill="url(#mountainGradient)" 
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
