"use client";

import { useTimer } from "@/components/providers/timer-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Pause, RefreshCw } from "lucide-react";
import React from "react";

interface TimerDisplayProps {
  compact?: boolean;
  actions?: React.ReactNode;
}

export function TimerDisplay({ compact = false, actions }: TimerDisplayProps) {
  const { isActive, timeLeft, formatTime, toggle, reset, sessionType } =
    useTimer();

  if (compact) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          margin: 0,
          padding: 0,
          overflow: "hidden",
          cursor: "pointer",
        }}
        onClick={toggle}
        title={isActive ? "Pause" : "Resume"}
      >
        <span
          style={{
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
            fontSize: "18px",
            fontWeight: 300,
            letterSpacing: "0.06em",
            color: isActive ? "#ffffff" : "#6b7280",
            fontVariantNumeric: "tabular-nums",
            userSelect: "none",
            lineHeight: 1,
            transition: "color 0.3s ease",
          }}
        >
          {formatTime(timeLeft)}
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Session Tag */}
      <div className="flex items-center gap-2 mb-8">
        <span className="flex h-3 w-3 relative">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              isActive ? "bg-blue-400" : "hidden",
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-3 w-3",
              isActive ? "bg-blue-500" : "bg-zinc-700",
            )}
          />
        </span>
        <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">
          {sessionType}
        </span>
      </div>

      {/* Main Timer */}
      <div className="relative mb-12 group cursor-pointer" onClick={toggle}>
        <div className="text-[120px] md:text-[200px] leading-none font-bold font-mono tracking-tighter tabular-nums select-none bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent transition-all group-hover:scale-105 duration-300">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mb-16">
        <Button
          size="lg"
          className={cn(
            "h-20 w-20 rounded-full text-xl transition-all shadow-[0_0_40px_rgba(0,0,0,0.5)]",
            isActive
              ? "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-red-500/50"
              : "bg-white text-black hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]",
          )}
          onClick={toggle}
        >
          {isActive ? (
            <Pause className="fill-current size-8" />
          ) : (
            <Play className="fill-current size-8 ml-1" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-zinc-800 bg-black/50 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-500 hover:text-white transition-all"
          onClick={reset}
        >
          <RefreshCw className="size-5" />
        </Button>
        {actions}
      </div>
    </>
  );
}
