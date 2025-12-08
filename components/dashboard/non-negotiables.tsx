"use client"

import React from "react"
import { Check, Flame } from "lucide-react"

const habits = [
  { id: 1, label: "1 CP Problem", completed: true },
  { id: 2, label: "Meditation (20m)", completed: false },
  { id: 3, label: "Read 10 Pages", completed: false },
]

export function NonNegotiables() {
  return (
    <div className="space-y-4">
    {/* Streaks or Header Stats */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <Flame className="size-4 text-orange-500" fill="currentColor" />
        <span>12 Day Streak</span>
      </div>

      <div className="space-y-2">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10"
          >
            <span className={habit.completed ? "text-zinc-500 line-through" : "text-zinc-200"}>
              {habit.label}
            </span>
            <button
              className={`flex size-6 items-center justify-center rounded-full border transition-all ${
                habit.completed
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-500"
                  : "border-zinc-700 bg-black/20 text-transparent hover:border-zinc-500"
              }`}
            >
              <Check className="size-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
