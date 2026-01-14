"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
interface Project {
  title: string;
  description: string | null;
  color: string;
}
interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createProject: (newProject: Project) => void;
  isCreating: boolean;
}
const COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
];
export const CreateProjectDialog = ({
  open,
  onOpenChange,
  createProject,
  isCreating,
}: CreateProjectDialogProps) => {
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    color: "#3b82f6",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors">
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
            <label className="text-sm font-medium text-zinc-400">Title</label>
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
                  onClick={() => setNewProject({ ...newProject, color: c })}
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
            disabled={!newProject.title || isCreating || !newProject.description}
            onClick={async () => {
              try {
                await createProject(newProject);
                onOpenChange(false);
                setNewProject({
                  title: "",
                  description: "",
                  color: "#3b82f6",
                });
              } catch {
                // handled in mutation
              }
            }}
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
  );
};
