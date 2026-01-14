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
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";

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
    mutationFn: async (newProject: {
      title: string;
      description: string | null;
      color: string;
    }) => {
      await axios.post("/api/projects", {
        ...newProject,
        startDate: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreateOpen(false);
      toast.success("Project created successfully");
    },
    onError: () => {
      toast.error("Failed to create project");
    },
  });
  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Sidebar for Filters */}
      <div className="w-64 shrink-0 border-r border-white/5 p-6 flex flex-col gap-6 bg-zinc-950/30">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-6">
            Projects
          </h1>
          <CreateProjectDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            createProject={createProject}
            isCreating={isCreating}
          />
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
