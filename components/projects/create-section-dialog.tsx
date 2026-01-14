"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateSectionDialogProps {
  onConfirm: (
    title: string,
    color: string,
    dueDate: string,
    startDate: string
  ) => Promise<void>;
  defaultColor: string;
  trigger?: React.ReactNode;
}

export function CreateSectionDialog({
  onConfirm,
  defaultColor,
  trigger,
}: CreateSectionDialogProps) {
  const [dueDate, setDueDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(defaultColor);
  const [isLoading, setIsLoading] = useState(false);

  const COLORS = [
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
  ];

  const handleSubmit = async () => {
    if (!title) return;
    setIsLoading(true);
    try {
      await onConfirm(title, color, dueDate, startDate);
      setTitle("");
      setIsOpen(false);
    } catch {
      // handled by parent toast generally
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // pass seter function to dialog to change isOpen state
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="p-1 hover:bg-white/5 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <Plus className="h-4 w-4" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Planning Phase"
              className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/10"
              autoFocus
              onKeyDown={(e) =>
                e.key === "Enter" && title && dueDate && handleSubmit()
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/10 scheme-dark"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              End Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/10 scheme-dark"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Color Tag
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-all cursor-pointer",
                    color === c
                      ? "border-white scale-110"
                      : "border-transparent hover:scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            disabled={!title || isLoading || !startDate || !dueDate}
            onClick={handleSubmit}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Section"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
