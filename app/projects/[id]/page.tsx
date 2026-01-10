"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Settings } from "lucide-react";
import { ProjectSidebar } from "@/components/projects/project-sidebar";
import { TimelineView } from "@/components/projects/timeline-view";
import { toast } from "sonner";
import { addDays } from "date-fns";

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch Project Data
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await axios.get(`/api/projects/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Mutations
  const { mutate: addSection } = useMutation({
    mutationFn: async ({ title, color }: { title: string; color: string }) => {
      const startDate = project?.startDate || new Date().toISOString();
      const endDate = addDays(new Date(startDate), 14).toISOString();

      await axios.post("/api/projects/sections", {
        projectId: id,
        title,
        startDate,
        endDate,
        color,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Section added");
    },
  });

  const { mutate: deleteSection } = useMutation({
    mutationFn: async (sectionId: string) => {
      await axios.delete(`/api/projects/sections?id=${sectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Section deleted");
    },
  });

  const { mutate: addTask } = useMutation({
    mutationFn: async ({
      sectionId,
      data,
    }: {
      sectionId: string;
      data: any;
    }) => {
      await axios.post("/api/tasks", {
        title: data.title,
        categoryId: data.categoryId,
        priority: data.priority,
        dueDate: data.dueDate,
        sectionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Task added");
    },
  });

  const { mutate: updateSectionStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await axios.patch("/api/projects/sections", { id, status });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["project", id] }),
  });

  const { mutate: updateSection } = useMutation({
    mutationFn: async (data: {
      id: string;
      title?: string;
      startDate?: string;
      endDate?: string;
      color?: string;
    }) => {
      await axios.patch("/api/projects/sections", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
  });

  const { mutate: updateProjectStatus } = useMutation({
    mutationFn: async (status: string) => {
      await axios.patch(`/api/projects/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Project status updated");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      {/* Top Navigation Bar */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-zinc-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/projects")}
            className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="text-lg font-semibold text-zinc-100">
              {project.title}
            </h1>
            <span className="text-xs text-zinc-500 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {project.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Sidebar + Timeline */}
      <div className="flex-1 flex overflow-hidden w-full">
        <ProjectSidebar
          sections={project.sections || []}
          projectStatus={project.status}
          isLoading={isLoading}
          onAddSection={async (title, color) =>
            await addSection({ title, color })
          }
          onDeleteSection={(secId) => deleteSection(secId)}
          onAddTask={async (secId, data) =>
            await addTask({ sectionId: secId, data })
          }
          onUpdateSectionStatus={(secId, status) =>
            updateSectionStatus({ id: secId, status })
          }
          onUpdateSection={(secId, data) =>
            updateSection({ id: secId, ...data })
          }
          onUpdateProjectStatus={(status) => updateProjectStatus(status)}
        />

        <div className="flex-1 relative">
          <TimelineView
            sections={project.sections || []}
            projectStartDate={project.startDate}
            projectEndDate={project.endDate}
            projectColor={project.color}
          />
        </div>
      </div>
    </div>
  );
}
