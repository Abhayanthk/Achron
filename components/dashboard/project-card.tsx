"use client"

import { MoreHorizontal } from "lucide-react"

const projects = [
  { id: 1, name: "Archon System v2", progress: 75, status: "Active" },
  { id: 2, name: "Mobile App Redesign", progress: 30, status: "Planning" },
  { id: 3, name: "AI Integration", progress: 50, status: "In Progress" },
]

export function ProjectCard() {
  return (
    <div className="space-y-6">
      {projects.map((project) => (
        <div key={project.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <h4 className="text-sm font-medium text-white">{project.name}</h4>
                <p className="text-xs text-zinc-500">{project.status}</p>
            </div>
            <button className="text-zinc-500 hover:text-white">
                <MoreHorizontal className="size-4" />
            </button>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
