"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

const projects = [
  { id: 1, name: "Archon System v2", progress: 75, status: "Active" },
  { id: 2, name: "Mobile App Redesign", progress: 30, status: "Planning" },
  { id: 3, name: "AI Integration", progress: 50, status: "In Progress" },
];

export function ProjectCard() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", "active"],
    queryFn: async () => {
      const res = await axios.get("/api/projects");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-white/5 rounded" />
              <div className="h-4 w-12 bg-white/5 rounded" />
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[120px] text-zinc-500 text-xs">
        <p>No active projects.</p>
      </div>
    );
  }

  const displayedProjects = projects.slice(0, 3);

  return (
    <div className="space-y-6">
      {displayedProjects.map((project: any) => {
        const totalSections = project.sections?.length || 0;
        const completedSections =
          project.sections?.filter((s: any) => s.status === "COMPLETED")
            .length || 0;
        const progress =
          totalSections > 0
            ? Math.round((completedSections / totalSections) * 100)
            : 0;

        return (
          <div key={project.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-sm font-medium text-white hover:underline decoration-white/30 underline-offset-4"
                >
                  {project.title}
                </Link>
                <p className="text-xs text-zinc-500">{project.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 tabular-nums">
                  {progress}%
                </span>
                <Link
                  href={`/projects/${project.id}`}
                  className="text-zinc-500 hover:text-white"
                >
                  <MoreHorizontal className="size-4" />
                </Link>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: project.color || "#ffffff",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
