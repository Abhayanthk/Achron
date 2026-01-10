"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, Layers, Trash2, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    startDate: string | null;
    endDate: string | null;
    color: string;
    _count?: {
      sections: number;
    };
    sections?: { status: string }[];
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/projects/${project.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project moved to trash");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={() => router.push(`/projects/${project.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 p-6 transition-colors hover:bg-zinc-900/80"
    >
      {/* Background Gradient Effect */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10"
        style={{
          background: `radial-gradient(circle at center, ${project.color}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div>
          <div className="flex items-start justify-between">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: `${project.color}20` }}
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: project.color }}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 border border-white/5 px-2 py-1 rounded-full">
                {project.status === "PAUSED" ? "ON HOLD" : project.status}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Move project to trash?")) deleteProject();
                }}
                disabled={isDeleting}
                className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-white/5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-zinc-100 group-hover:text-white transition-colors">
            {project.title}
          </h3>

          {project.description && (
            <p className="mt-2 text-sm text-zinc-500 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex flex-col gap-1.5 flex-1 mr-4">
            {/* Progress Bar */}
            {(project.sections?.length || 0) > 0 && (
              <div className="space-y-1">
                <div className="h-1 bg-white/5 rounded-full overflow-hidden w-full">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.round(
                        (project.sections!.filter(
                          (s) => s.status === "COMPLETED"
                        ).length /
                          project.sections!.length) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {project.startDate && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(project.startDate), "MMM d")}
                  {project.endDate &&
                    ` - ${format(new Date(project.endDate), "MMM d")}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Layers className="h-3 w-3" />
              <span>{project._count?.sections || 0} Sections</span>
            </div>
          </div>

          <button className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-white/10 group-hover:text-white transition-all self-end mb-1">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
