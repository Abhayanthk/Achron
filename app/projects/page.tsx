"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, Loader2, Sparkles, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectCard } from "@/components/projects/project-card";
import {
  ProjectFilters,
  ProjectFilterType,
} from "@/components/projects/project-filters";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  color: string;
  _count: {
    sections: number;
  };
  sections: { status: string }[];
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    color: "#3b82f6",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<ProjectFilterType>("ACTIVE");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", searchQuery, filter],
    queryFn: async () => {
      const res = await axios.get("/api/projects", {
        params: {
          search: searchQuery,
          filter: filter,
        },
      });
      return res.data as Project[];
    },
  });

  const { mutate: createProject, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      await axios.post("/api/projects", {
        ...newProject,
        startDate: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreateOpen(false);
      setNewProject({ title: "", description: "", color: "#3b82f6" });
      toast.success("Project created successfully");
    },
    onError: () => {
      toast.error("Failed to create project");
    },
  });

  const COLORS = [
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
  ];

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Sidebar for Filters */}
      <div className="w-64 shrink-0 border-r border-white/5 p-6 flex flex-col gap-6 bg-zinc-950/30">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-6">
            Projects
          </h1>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors">
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">
                    Title
                  </label>
                  <input
                    value={newProject.title}
                    onChange={(e) =>
                      setNewProject({ ...newProject, title: e.target.value })
                    }
                    placeholder="e.g. World Domination"
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        description: e.target.value,
                      })
                    }
                    placeholder="What's the plan?"
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/10 h-24 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() =>
                          setNewProject({ ...newProject, color: c })
                        }
                        className={cn(
                          "h-8 w-8 rounded-full border-2 transition-all",
                          newProject.color === c
                            ? "border-white scale-110"
                            : "border-transparent hover:scale-110"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <button
                  disabled={!newProject.title || isCreating}
                  onClick={() => createProject()}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create Project"
                  )}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ProjectFilters currentFilter={filter} onFilterChange={setFilter} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        {/* Header / Search */}
        <div className="h-16 border-b border-white/5 flex items-center px-8 justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 w-full focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div className="text-sm text-zinc-500">
            {projects?.length || 0} Projects
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          ) : !projects?.length ? (
            <div className="flex flex-col items-center justify-center h-96 text-zinc-500 border border-dashed border-white/5 rounded-3xl bg-zinc-900/20">
              <Sparkles className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-zinc-300">
                No projects found
              </h3>
              <p className="max-w-sm text-center mt-2">
                {searchQuery
                  ? "Try adjusting your search terms."
                  : "Create your first project to get started."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {projects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <ProjectCard project={project} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
