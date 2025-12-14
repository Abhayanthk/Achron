'use client'

import { createPortal } from 'react-dom'
import { useTimer } from "@/components/providers/timer-context"
import { Play, Pause, Square, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TimerPiP() {
    const { pipWindow, timeLeft, formatTime, toggle, status, sessionType } = useTimer()

    if (!pipWindow) return null

    // Portal the UI into the PiP window body
    return createPortal(
        <div className="flex flex-col items-center justify-center p-6 h-full w-full bg-zinc-950 text-white select-none">
            {/* Session Type Badge */}
            <div className="mb-2 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/10">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                    {sessionType}
                </span>
            </div>

            {/* Time Display */}
            <span className={status === 'RUNNING' ? "text-6xl font-mono font-bold text-white tabular-nums tracking-tighter" : "text-6xl font-mono font-bold text-zinc-600 tabular-nums tracking-tighter"}>
                {formatTime(timeLeft)}
            </span>
            
            {/* Status Text */}
            <span className="text-xs font-medium text-zinc-500 mt-2 mb-6 uppercase tracking-widest">
                {status === 'RUNNING' ? "Focusing" : "Paused"}
            </span>
            
            {/* Controls */}
            <div className="flex items-center gap-4">
                 <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={toggle}
                    className="size-12 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-blue-400 transition-colors"
                 >
                    {status === 'RUNNING' ? <Pause className="fill-current size-5" /> : <Play className="fill-current size-5 ml-1" />}
                 </Button>
            </div>
        </div>,
        pipWindow.document.body
    )
}
