"use client"

import { Play, Pause, RefreshCw, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTimer } from "@/components/providers/timer-context"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function FocusTimer() {
  const { isActive, timeLeft, sessionType, toggle, reset, formatTime, presets, setSession } = useTimer()

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
        <div className="relative z-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75", isActive ? "duration-1000" : "hidden")}></span>
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", isActive ? "bg-blue-500" : "bg-zinc-700")}></span>
                </span>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="text-xs font-bold text-zinc-400 tracking-widest uppercase hover:text-white transition-colors text-left truncate max-w-[120px]">
                            {sessionType}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-zinc-950 border-zinc-800">
                        {presets.map((preset) => (
                            <DropdownMenuItem 
                                key={preset.id}
                                className="text-zinc-400 focus:text-white focus:bg-white/10 cursor-pointer text-xs"
                                onClick={() => setSession(preset.duration, preset.type)}
                            >
                                {preset.name} ({Math.floor(preset.duration / 60)}m)
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Link href="/timer">
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white -mr-2">
                    <Maximize2 className="size-3" />
                 </Button>
            </Link>
        </div>

        {/* Timer Display */}
        <div className="relative z-10 my-4">
            <div className="text-6xl font-mono font-bold text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {formatTime(timeLeft)}
            </div>
        </div>

        {/* Controls */}
        <div className="relative z-10 flex items-center gap-3">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={toggle}
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
                onClick={reset}
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
