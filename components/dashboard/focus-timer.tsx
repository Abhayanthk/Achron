"use client"

import { useState, useEffect } from "react"
import { Play, Pause, RefreshCw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export function FocusTimer() {
  const [isActive, setIsActive] = useState(false)
  const [time, setTime] = useState(25 * 60) // 25 minutes default
  const [sessionType, setSessionType] = useState<"DEEP WORK" | "FLOW" | "CODING">("DEEP WORK")

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1)
      }, 1000)
    } else if (time === 0) {
      setIsActive(false)
    }

    return () => clearInterval(interval)
  }, [isActive, time])

  const toggleTimer = () => setIsActive(!isActive)
  const resetTimer = () => {
    setIsActive(false)
    setTime(25 * 60)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full bg-black border border-white/5 rounded-xl p-6 flex flex-col items-center justify-between relative overflow-hidden">
        
        {/* Animated Background Effect */}
        <div className={cn(
            "absolute inset-0 transition-opacity duration-1000 pointer-events-none",
            isActive ? "opacity-100" : "opacity-0"
        )}>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(59,130,246,0.1)_0%,transparent_70%)] animate-pulse" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75", isActive ? "duration-1000" : "hidden")}></span>
                <span className={cn("relative inline-flex rounded-full h-2 w-2", isActive ? "bg-blue-500" : "bg-zinc-700")}></span>
            </span>
            <span className="text-xs font-bold text-zinc-400 tracking-widest uppercase">{sessionType}</span>
        </div>

        {/* Timer Display */}
        <div className="relative z-10 my-4">
            <div className="text-6xl font-mono font-bold text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {formatTime(time)}
            </div>
        </div>

        {/* Controls */}
        <div className="relative z-10 flex items-center gap-3">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleTimer}
                className={cn(
                    "h-12 w-12 rounded-full border-2 transition-all hover:scale-105 active:scale-95",
                    isActive ? "border-blue-500/50 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white"
                )}
            >
                {isActive ? <Pause className="fill-current size-5" /> : <Play className="fill-current size-5 ml-1" />}
            </Button>
            
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={resetTimer}
                className="h-10 w-10 text-zinc-600 hover:text-zinc-400 hover:bg-transparent"
            >
                <RefreshCw className="size-4" />
            </Button>
        </div>

        {/* Dynamic footer text */}
        <div className="relative z-10 h-6 overflow-hidden">
             <AnimatePresence mode="wait">
                {isActive ? (
                    <motion.div
                        key="active"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="text-[10px] text-blue-400/80 font-medium uppercase tracking-widest text-center"
                    >
                        Focus Mode Active
                    </motion.div>
                ) : (
                    <motion.div
                         key="idle"
                         initial={{ y: 20, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         exit={{ y: -20, opacity: 0 }}
                         className="text-[10px] text-zinc-700 font-medium uppercase tracking-widest text-center"
                    >
                        Ready to grind
                    </motion.div>
                )}
             </AnimatePresence>
        </div>
    </div>
  )
}
