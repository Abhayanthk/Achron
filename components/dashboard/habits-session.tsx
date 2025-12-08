"use client"

import { CheckCircle2, Circle, Flame, Trophy } from "lucide-react"
import { motion } from "framer-motion"

const activeHabits = [
  { id: 1, name: "Morning Run (5k)", days: 12, target: 21 },
  { id: 2, name: "Deep Work (2h)", days: 5, target: 21 },
  { id: 3, name: "No Sugar", days: 18, target: 21 },
]

const masteredHabits = [
  { id: 4, name: "Daily Reading", date: "Nov 2024" },
  { id: 5, name: "Meditation", date: "Oct 2024" },
]

export function HabitsSession() {
  return (
    <div className="space-y-6">
      {/* Mastering Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Flame className="size-3 text-orange-500" />
            Mastering
        </h4>
        <div className="grid grid-cols-1 gap-3">
            {activeHabits.map((habit) => (
                <div key={habit.id} className="relative overflow-hidden rounded-lg bg-white/5 border border-white/5 p-3 group hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-white">{habit.name}</span>
                        <span className="text-xs text-zinc-400">{habit.days} / {habit.target} Days</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(habit.days / habit.target) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                        />
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Mastered Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Trophy className="size-3 text-yellow-500" />
            Mastered
        </h4>
        <div className="flex flex-wrap gap-2">
            {masteredHabits.map((habit) => (
                <div key={habit.id} className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    {habit.name}
                </div>
            ))}
        </div>
      </div>
    </div>
  )
}
