
"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
// import { NonNegotiable } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { 
    eachDayOfInterval, 
    format, 
    isSameDay, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachWeekOfInterval,
    getISODay,
    isSameMonth
} from "date-fns"
import { motion } from "framer-motion"
import { useState } from "react"

interface NonNegotiable {
    id: string
    title: string
    completedDates: string[] // ISO strings
}

export function ConsistencyHeatmap({ data = [] }: { data: NonNegotiable[] }) {
    const [hoveredDay, setHoveredDay] = useState<{date: Date, intensity: number} | null>(null)

    // Generate last 12 months
    const today = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
        const d = subMonths(today, i)
        months.push(d)
    }

    const getIntensity = (date: Date) => {
        if (data.length === 0) return 0;
        const allCompleted = data.every(task => {
            return task.completedDates.some(d => isSameDay(new Date(d), date));
        });
        return allCompleted ? 1 : 0;
    }

    // Helper to generate a matrix for a month
    const getMonthMatrix = (monthDate: Date) => {
        const monthStart = startOfMonth(monthDate)
        const monthEnd = endOfMonth(monthDate)
        
        const matrixStart = startOfWeek(monthStart, { weekStartsOn: 1 })
        const matrixEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

        const days = eachDayOfInterval({ start: matrixStart, end: matrixEnd })

        // Group into weeks
        const weeks: { date: Date; intensity: number; isValid: boolean }[][] = []
        let currentWeek: { date: Date; intensity: number; isValid: boolean }[] = []
        
        days.forEach((day) => {
             const belongs = isSameMonth(day, monthDate)
             currentWeek.push({
                 date: day,
                 intensity: belongs ? getIntensity(day) : -1, 
                 isValid: belongs
             })

             if (currentWeek.length === 7) {
                 weeks.push(currentWeek)
                 currentWeek = []
             }
        })
        
        return weeks
    }

    return (
        <div className="w-full flex flex-col">
             {/* Header */}
             <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-white tracking-tight">Consistency Constellation</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Yearly Performance</span>
                </div>
                <div className="flex gap-4 text-[10px] text-zinc-500 uppercase tracking-widest">
                     <div className="flex items-center gap-1.5">
                         <div className="size-3 rounded-[1px] bg-zinc-900/40 border border-zinc-800/50" />
                         <span>Missed</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                         <div className="size-3 rounded-[1px] bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] border border-emerald-400/50" />
                         <span>Perfect</span>
                     </div>
                 </div>
             </div>

             <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 pb-4">
                 <div className="flex gap-2 min-w-max px-2">
                     {months.map((monthDate, mIndex) => {
                         const weeks = getMonthMatrix(monthDate)
                         return (
                             <div key={mIndex} className="flex flex-col gap-2">
                                 {/* The Grid Block */}
                                 <div className="flex gap-[3px]">
                                     {weeks.map((week, wIndex) => (
                                         <div key={wIndex} className="flex flex-col gap-[3px]">
                                             {week.map((day, dIndex) => (
                                                 // dIndex 0=Mon, 6=Sun
                                                 day.isValid ? (
                                                     <Popover key={`${mIndex}-${wIndex}-${dIndex}`}>
                                                         <PopoverTrigger asChild>
                                                             <motion.div 
                                                                whileHover={{ scale: 1.2, zIndex: 10 }}
                                                                className={cn(
                                                                    "size-3.5 rounded-[1px] cursor-pointer transition-all duration-200",
                                                                    day.intensity === 1 
                                                                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] border border-emerald-400/30" 
                                                                        : "bg-zinc-900/40 border border-zinc-800/30 hover:border-zinc-700"
                                                                )}
                                                                onMouseEnter={() => setHoveredDay({ date: day.date, intensity: day.intensity })}
                                                                onMouseLeave={() => setHoveredDay(null)}
                                                             />
                                                         </PopoverTrigger>
                                                         <PopoverContent className="w-auto p-2 bg-zinc-950 border-zinc-800 text-zinc-400 text-xs font-mono shadow-xl">
                                                             <div className="flex flex-col gap-1">
                                                                 <span className="text-zinc-200 font-bold">{format(day.date, "MMM d, yyyy")}</span>
                                                                 <span className={day.intensity === 1 ? "text-emerald-500" : "text-zinc-600"}>
                                                                     {day.intensity === 1 ? "Perfect Day" : "Incomplete"}
                                                                 </span>
                                                             </div>
                                                         </PopoverContent>
                                                     </Popover>
                                                 ) : (
                                                     // Invisible placeholder to maintain grid alignment
                                                     <div key={`placeholder-${dIndex}`} className="size-3.5" />
                                                 )
                                             ))}
                                         </div>
                                     ))}
                                 </div>

                                 {/* Month Label Bottom */}
                                 <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider text-center">
                                     {format(monthDate, "MMM")}
                                 </span>
                             </div>
                         )
                     })}
                 </div>
             </div>
        </div>
    )
}
