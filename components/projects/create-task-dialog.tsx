"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Calendar, Flag, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface CreateTaskDialogProps {
  onConfirm: (data: {
    title: string;
    priority: string;
    categoryId: string | null;
    dueDate: string | null;
  }) => Promise<void>;
  trigger?: React.ReactNode;
}

export function CreateTaskDialog({
  onConfirm,
  trigger,
}: CreateTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("WHITE");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>(""); // Input type=date uses YYYY-MM-DD
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axios.get("/api/categories");
      return res.data;
    },
    enabled: isOpen,
  });

  const PRIORITIES = [
    { id: "RED", color: "bg-red-500", label: "High" },
    { id: "ORANGE", color: "bg-orange-500", label: "Medium" },
    { id: "YELLOW", color: "bg-yellow-500", label: "Low" },
    { id: "WHITE", color: "bg-zinc-500", label: "None" },
  ];

  const handleSubmit = async () => {
    if (!title) return;
    setIsLoading(true);
    try {
      await onConfirm({
        title,
        priority,
        categoryId: categoryId === "none" ? null : categoryId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      setTitle("");
      setPriority("WHITE");
      setCategoryId(null);
      setDueDate("");
      setIsOpen(false);
    } catch {
      // handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="p-1 hover:bg-white/5 rounded-md text-zinc-400 hover:text-white transition-colors">
            <Plus className="h-3 w-3" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Task Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design Database Schema"
              className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/10"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/10 scheme-dark"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Hash className="h-3 w-3" /> Category
              </label>
              <select
                value={categoryId || "none"}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value === "none" ? null : e.target.value
                  )
                }
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/10"
              >
                <option value="none">No Category</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Flag className="h-3 w-3" /> Priority
            </label>
            <div className="flex items-center gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={cn(
                    "w-full py-1.5 rounded-md text-xs font-medium border border-transparent transition-all",
                    priority === p.id
                      ? "bg-white/10 border-white/20 text-white"
                      : "hover:bg-white/5 text-zinc-500"
                  )}
                >
                  <div
                    className={cn("w-2 h-2 rounded-full mx-auto mb-1", p.color)}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!title || isLoading}
            onClick={handleSubmit}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Task"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
