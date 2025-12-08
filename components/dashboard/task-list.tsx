"use client"

import { Clock, Circle } from "lucide-react"

const tasks = [
  { id: 1, title: "Review Pull Request #42", time: "10:00 AM", status: "pending" },
  { id: 2, title: "Client Meeting", time: "2:30 PM", status: "upcoming" },
  { id: 3, title: "Fix Sidebar Bug", time: "4:00 PM", status: "pending" },
]

export function TaskList() {
  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
          <div className="mt-1 flex size-2 items-center justify-center">
            <div className={`size-2 rounded-full ${task.status === 'upcoming' ? 'bg-amber-500' : 'bg-zinc-500'}`} />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-zinc-200">{task.title}</p>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Clock className="size-3" />
              <span>{task.time}</span>
            </div>
          </div>
        </div>
      ))}
       <button className="w-full text-center text-xs text-zinc-500 hover:text-white transition-colors pt-2">
            View All Tasks
        </button>
    </div>
  )
}
