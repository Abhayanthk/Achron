"use client";

import { useState, useEffect } from "react";
import { useTimer } from "@/components/providers/timer-context";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, X, SquareArrowOutUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function MiniTimer() {
  const { isActive, timeLeft, formatTime, toggle, sessionType, status } =
    useTimer();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  // Show when:
  // 1. Timer is Running OR Paused (Active Session)
  // 2. User IS NOT on the dedicated timer page
  useEffect(() => {
    const isTimerPage = pathname === "/timer";
    const hasActiveSession = status !== "IDLE"; // IDLE means no session

    setIsVisible(hasActiveSession && !isTimerPage);
  }, [pathname, status]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragMomentum={false}
        whileHover={{ scale: 1.05 }}
        whileDrag={{ scale: 1.1, cursor: "grabbing" }}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 flex flex-col gap-2 items-center right-6 z-50  bg-zinc-950/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing"
      >
        {/* Info */}

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            {sessionType}
          </span>
          <Link href="/timer">
            <SquareArrowOutUpRight className="size-4 text-zinc-300 hover:text-white hover:cursor-pointer" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-mono font-bold tracking-tight text-white tabular-nums">
            {formatTime(timeLeft)}
          </span>
          {/* Controls */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hover:bg-white/10 text-zinc-300 hover:text-white"
              onClick={toggle}
            >
              {isActive ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 fill-current" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
