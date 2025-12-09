"use client"

import { Trophy, Star, ChevronRight } from "lucide-react"

export function JourneyHeader() {
  // Mock data
  const currentXP = 7750
  const nextLevelXP = 8000
  const level = 77
  const progress = (currentXP / nextLevelXP) * 100

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50 p-6 backdrop-blur-md">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                     <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest">Current Status</h2>
                     <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-5xl font-bold text-white">{level}</span>
                        <span className="text-sm font-medium text-zinc-500">LEVEL</span>
                     </div>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10">
                    <Trophy className="size-6 text-yellow-500" />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <span className="text-white">{currentXP.toLocaleString()} XP</span>
                    <span className="text-zinc-500">{nextLevelXP.toLocaleString()} XP</span>
                </div>
                <div className="h-3 w-full rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-1000 ease-out" 
                        style={{ width: `${progress}%` }} 
                    />
                </div>
                <p className="text-xs text-zinc-500 text-right">{Math.round(nextLevelXP - currentXP)} XP to Level {level + 1}</p>
            </div>
        </div>
    </div>
  )
}
