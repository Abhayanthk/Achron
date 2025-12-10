"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type SessionType = "DEEP WORK" | "FLOW" | "CODING" | "LEARNING" | "WRITING" | "CUSTOM"

interface TimerState {
  isActive: boolean
  timeLeft: number
  duration: number
  sessionType: SessionType | string
  sessionName?: string
}

export interface TimerPreset {
    id: string
    name: string
    duration: number
    type: SessionType | string
    color: string
}

const DEFAULT_PRESETS: TimerPreset[] = [
    { id: "1", name: "Deep Work", duration: 90 * 60, type: "DEEP WORK", color: "bg-blue-500" },
    { id: "2", name: "Flow State", duration: 45 * 60, type: "FLOW", color: "bg-purple-500" },
    { id: "3", name: "Quick Focus", duration: 25 * 60, type: "CODING", color: "bg-emerald-500" },
    { id: "4", name: "Learning", duration: 60 * 60, type: "LEARNING", color: "bg-amber-500" },
]

interface TimerContextType extends TimerState {
  start: () => void
  pause: () => void
  reset: () => void
  setSession: (duration: number, type: SessionType | string, name?: string) => void
  toggle: () => void
  formatTime: (seconds: number) => string
  presets: TimerPreset[]
  addPreset: (preset: Omit<TimerPreset, "id">) => void
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

const DEFAULT_DURATION = 25 * 60

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION)
  const [duration, setDuration] = useState(DEFAULT_DURATION)
  const [sessionType, setSessionType] = useState<SessionType | string>("DEEP WORK")
  const [sessionName, setSessionName] = useState<string | undefined>(undefined)
  const [presets, setPresets] = useState<TimerPreset[]>(DEFAULT_PRESETS)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("achron-timer-state")
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setTimeLeft(parsed.timeLeft)
        setDuration(parsed.duration)
        setSessionType(parsed.sessionType)
        setSessionName(parsed.sessionName)
        if (parsed.presets) setPresets(parsed.presets)
      } catch (e) {
        console.error("Failed to parse timer state", e)
      }
    }
  }, [])

  // Save state to localStorage on change
  useEffect(() => {
    localStorage.setItem("achron-timer-state", JSON.stringify({
      isActive,
      timeLeft,
      duration,
      sessionType,
      sessionName,
      presets
    }))
  }, [isActive, timeLeft, duration, sessionType, sessionName, presets])

  // Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
            const next = prev - 1
            if (next <= 0) {
                setIsActive(false)
                return 0
            }
            return next
        })
      }, 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
    }

    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  const start = () => setIsActive(true)
  const pause = () => setIsActive(false)
  const toggle = () => setIsActive(!isActive)
  
  const reset = () => {
    setIsActive(false)
    setTimeLeft(duration)
  }

  const setSession = (newDuration: number, newType: SessionType | string, newName?: string) => {
    setIsActive(false)
    setDuration(newDuration)
    setTimeLeft(newDuration)
    setSessionType(newType)
    setSessionName(newName)
  }
  
  const addPreset = (preset: Omit<TimerPreset, "id">) => {
      const newPreset = { ...preset, id: Math.random().toString(36).substr(2, 9) }
      setPresets([...presets, newPreset])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <TimerContext.Provider value={{
      isActive,
      timeLeft,
      duration,
      sessionType,
      sessionName,
      start,
      pause,
      reset,
      toggle,
      setSession,
      formatTime,
      presets,
      addPreset
    }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider")
  }
  return context
}
