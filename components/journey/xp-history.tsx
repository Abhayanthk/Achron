"use client"

import { Clock, CheckCircle, Flame, FileCode, CheckSquare } from "lucide-react"

const history = [
    { id: 1, source: "Deep Work Session", xp: 150, date: "2 mins ago", icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
    { id: 2, source: "Task: Fix Bugs", xp: 50, date: "1 hour ago", icon: CheckSquare, color: "text-green-400", bg: "bg-green-500/10" },
    { id: 3, source: "Non-Negotiable: Gym", xp: 100, date: "4 hours ago", icon: Flame, color: "text-red-400", bg: "bg-red-500/10" },
    { id: 4, source: "Project: Archon", xp: 200, date: "Yesterday", icon: FileCode, color: "text-purple-400", bg: "bg-purple-500/10" },
    { id: 5, source: "Trait Upgrade", xp: 500, date: "Yesterday", icon: CheckCircle, color: "text-yellow-400", bg: "bg-yellow-500/10" },
]

export function XPHistory() {
    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-950/50 backdrop-blur-md overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-semibold text-white">Recent XP</h3>
            </div>
            <div className="p-2">
                {history.map((item) => (
                    <div key={item.id} className="group flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                        <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                            <item.icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">{item.source}</p>
                            <p className="text-xs text-zinc-500">{item.date}</p>
                        </div>
                        <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-1 rounded">
                            +{item.xp}
                        </span>
                    </div>
                ))}
            </div>
            <div className="p-3 border-t border-white/10 text-center">
                <button className="text-xs text-zinc-400 hover:text-white transition-colors">View All History</button>
            </div>
        </div>
    )
}
