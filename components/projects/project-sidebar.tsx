"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Pencil,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CreateSectionDialog } from "@/components/projects/create-section-dialog";
import { CreateTaskDialog } from "@/components/projects/create-task-dialog";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  sectionId?: string | null;
}

interface Section {
  id: string;
  title: string;
  status: string; // "ACTIVE" | "COMPLETED"
  tasks: Task[];
}

interface ProjectSidebarProps {
  sections: Section[];
  projectStatus: string;
  onAddSection: (title: string, color: string) => Promise<void>;
  onAddTask: (
    sectionId: string,
    data: {
      title: string;
      priority: string;
      categoryId: string | null;
      dueDate: string | null;
    }
  ) => Promise<void>;
  onDeleteSection: (sectionId: string) => void;
  onUpdateSectionStatus: (sectionId: string, status: string) => Promise<void>;
  onUpdateSection: (sectionId: string, data: { title: string }) => void;
  onUpdateProjectStatus: (status: string) => void;
  isLoading?: boolean;
  updateProjectStatusPending?: boolean;
  updateSectionStatusPending?: boolean;
}

export function ProjectSidebar({
  sections,
  projectStatus,
  onAddSection,
  onAddTask,
  onDeleteSection,
  onUpdateSectionStatus,
  onUpdateSection,
  onUpdateProjectStatus,
  isLoading,
  updateProjectStatusPending,
  updateSectionStatusPending,
}: ProjectSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [updatingSectionStatusId, setUpdatingSectionStatusId] = useState<
    string | null
  >(null);
  const [editTitle, setEditTitle] = useState("");

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (section: Section) => {
    setEditingSectionId(section.id);
    setEditTitle(section.title);
  };

  const saveEditing = async () => {
    if (!editingSectionId || !editTitle.trim()) {
      setEditingSectionId(null);
      return;
    }
    onUpdateSection(editingSectionId, { title: editTitle });
    setEditingSectionId(null);
  };

  const completedSectionsCount = sections.filter(
    (s) => s.status === "COMPLETED"
  ).length;
  const progress =
    sections.length > 0
      ? Math.round((completedSectionsCount / sections.length) * 100)
      : 0;

  const handleCompleteProject = () => {
    if (sections.length === 0) {
      toast.error("Cannot complete an empty project");
      return;
    }
    const allCompleted = sections.every((s) => s.status === "COMPLETED");
    if (!allCompleted) {
      toast.error("All sections must be completed first");
      return;
    }
    onUpdateProjectStatus("COMPLETED");
  };

  return (
    <div className="w-80 h-full border-r border-white/5 bg-zinc-900/30 flex flex-col backdrop-blur-xl">
      <div className="p-4 border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-100">Sections</h2>
          <CreateSectionDialog
            onConfirm={onAddSection}
            defaultColor="#3b82f6"
          />
        </div>

        {/* Project Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sections.map((section) => (
          <div
            key={section.id}
            className={cn(
              "space-y-1 transition-opacity",
              section.status === "COMPLETED" && "opacity-60"
            )}
          >
            {/* Section Header */}
            <div
              onClick={() => toggleSection(section.id)}
              className="flex items-center gap-1 p-2 hover:bg-white/5 rounded-lg group cursor-pointer"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection(section.id);
                }}
                className="p-0.5 text-zinc-500 hover:text-zinc-300"
              >
                {expandedSections[section.id] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Check/Complete Section */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const newStatus =
                    section.status === "COMPLETED" ? "ACTIVE" : "COMPLETED";
                  setUpdatingSectionStatusId(section.id);
                  await onUpdateSectionStatus(section.id, newStatus);
                  setUpdatingSectionStatusId(null);
                }}
                className={cn(
                  "p-0.5 transition-colors",
                  section.status === "COMPLETED"
                    ? "text-emerald-500"
                    : "text-zinc-600 hover:text-emerald-500"
                )}
              >
                {updateSectionStatusPending &&
                section.id === updatingSectionStatusId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : section.status === "COMPLETED" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </button>

              {editingSectionId === section.id ? (
                <div
                  className="flex items-center gap-1 flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditing();
                      if (e.key === "Escape") setEditingSectionId(null);
                    }}
                    className="flex-1 bg-zinc-900 border border-zinc-700 text-xs px-1 py-0.5 text-white rounded focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={saveEditing}
                    className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setEditingSectionId(null)}
                    className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className={cn(
                      "flex-1 text-sm font-medium text-zinc-200 truncate select-none",
                      section.status === "COMPLETED" &&
                        "line-through text-zinc-500"
                    )}
                  >
                    {section.title}
                  </span>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(section);
                      }}
                      className="p-1 text-zinc-500 hover:text-zinc-300"
                      disabled={section.status === "COMPLETED"}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <CreateTaskDialog
                      onConfirm={(data) => onAddTask(section.id, data)}
                      trigger={
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-zinc-500 hover:text-zinc-300 pointer-events-auto"
                          disabled={section.status === "COMPLETED"}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      }
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete section?"))
                          onDeleteSection(section.id);
                      }}
                      className="p-1 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Tasks List */}
            <AnimatePresence>
              {expandedSections[section.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-8 pr-2 pb-2 space-y-0.5">
                    {section.tasks.length === 0 ? (
                      <div className="text-[10px] text-zinc-600 pl-2 italic py-1">
                        top empty
                      </div>
                    ) : (
                      section.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="group flex items-center gap-2 p-1.5 rounded-md hover:bg-white/5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        >
                          <div
                            className={cn(
                              "h-1.5 w-1.5 rounded-full border border-current",
                              task.isCompleted
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-zinc-600"
                            )}
                          />
                          <span
                            className={cn(
                              "flex-1 truncate",
                              task.isCompleted && "line-through opacity-50"
                            )}
                          >
                            {task.title}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {!isLoading && sections.length === 0 && (
          <div className="p-4 text-center text-xs text-zinc-500">
            No sections created.
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/5 bg-zinc-900/50 space-y-2">
        {projectStatus === "COMPLETED" ? (
          <div className="text-center text-emerald-500 text-sm font-medium py-2 border border-emerald-500/20 bg-emerald-500/10 rounded-lg">
            Project Completed
          </div>
        ) : (
          <>
            <button
              onClick={handleCompleteProject}
              disabled={updateProjectStatusPending}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Project
            </button>
            <button
              onClick={() =>
                onUpdateProjectStatus(
                  projectStatus === "PAUSED" ? "ACTIVE" : "PAUSED"
                )
              }
              disabled={updateProjectStatusPending}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {projectStatus === "PAUSED" ? "Resume Project" : "Pause Project"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
