'use client'

import { useState, useEffect } from 'react'
import { useTimer } from "@/components/providers/timer-context"
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, PictureInPicture2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function MiniTimer() {
    const { isActive, timeLeft, formatTime, toggle, sessionType, status, togglePiP, pipWindow } = useTimer()
    const pathname = usePathname()
    const [isVisible, setIsVisible] = useState(false)

    // Show when: 
    // 1. Timer is Running OR Paused (Active Session)
    // 2. User IS NOT on the dedicated timer page
    useEffect(() => {
        const isTimerPage = pathname === '/timer'
        const hasActiveSession = status !== 'IDLE' // IDLE means no session
        
        setIsVisible(hasActiveSession && !isTimerPage)
    }, [pathname, status])

    // If PiP is active, we validly MIGHT want to hide the in-page widget?
    // Or keep it? Let's hide in-page widget if PiP is open to avoid clutter.
    if (pipWindow) return null;

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-zinc-950/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md"
            >
                {/* Info */}
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{sessionType}</span>
                    <span className="text-2xl font-mono font-bold tracking-tight text-white tabular-nums">
                        {formatTime(timeLeft)}
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 hover:bg-white/10 text-zinc-300 hover:text-white"
                        onClick={toggle}
                    >
                        {isActive ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
                    </Button>
                    
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 hover:bg-white/10 text-zinc-300 hover:text-white"
                        onClick={togglePiP}
                        title="Pop Out Player"
                    >
                        <PictureInPicture2 className="size-4" />
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
