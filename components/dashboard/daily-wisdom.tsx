"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function DailyWisdom() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full flex flex-col justify-between p-6 bg-black border border-white/5 rounded-xl relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-32 bg-white/2 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div>
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-1">Local Time</h2>
          <div className="text-4xl font-mono font-bold text-white tracking-tight">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-zinc-600 font-mono mt-1">
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
      </div>

      <div className="space-y-4 relative z-10">
          <div className="space-y-2">
            <h3 className="text-xl font-medium text-zinc-200 leading-relaxed italic font-serif">
                "The only way to do great work is to love what you do."
            </h3>
            <div className="h-px w-12 bg-white/20" />
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Steve Jobs</p>
          </div>
          
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
             <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Your Why</p>
             <p className="text-sm text-zinc-300 font-medium">To build systems that empower humanity.</p>
          </div>
      </div>
    </div>
  )
}
