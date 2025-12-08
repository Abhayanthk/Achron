"use client"

import { Brain, Dumbbell, Target, Trophy, Zap, Code, Terminal } from "lucide-react"

const identities = [
  { id: 1, name: "Competitive Programmer", title: "Grandmaster", level: 42, icon: Terminal, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { id: 2, name: "Discipline", title: "Monk Mode", level: 12, icon: Target, color: "text-red-500", bg: "bg-red-500/10" },
  { id: 3, name: "Consistency", title: "Unstoppable", level: 8, icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: 4, name: "Mental Clarity", title: "Zen Master", level: 15, icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10" },
]

export function IdentityProgress() {
  return (
    <div className="space-y-6">
      {/* Main Level Display */}
      <div className="relative flex items-center justify-between overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-zinc-900 to-black p-6">
        <div>
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Total Level</h3>
          <p className="text-4xl font-bold text-white mt-1">LVL 77</p>
        </div>
        <div className="text-right">
           <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">Next Milestone</p>
           <p className="text-lg font-bold text-white">LVL 80</p>
        </div>
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-zinc-800/20 blur-3xl rounded-full -z-10" />
      </div>

      {/* Identity List - No Progress Bars, Just Status */}
      <div className="flex flex-col gap-3">
        {identities.map((identity) => (
          <div key={identity.id} className="group flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${identity.bg} ${identity.color}`}>
                 <identity.icon className="size-4" />
              </div>
              <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-200">{identity.name}</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{identity.title}</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-white bg-black/40 border border-white/10 px-2 py-1 rounded">LVL {identity.level}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
