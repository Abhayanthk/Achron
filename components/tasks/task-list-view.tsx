"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Loader2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Flag,
  Trash2,
} from "lucide-react";
import { format, isSameDay, isPast, isFuture } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  description?: string;
  dueDate?: string;
  priority: "RED" | "ORANGE" | "YELLOW" | "WHITE";
  category?: {
    name: string;
    color?: string;
  };
  xp: number;
}

interface TaskListViewProps {
  filter: "ALL" | "TODAY" | "UPCOMING" | "OVERDUE" | "COMPLETED";
  searchQuery: string;
}

const PRIORITY_COLORS = {
  RED: "text-red-500 border-red-500/50 bg-red-500/10",
  ORANGE: "text-orange-500 border-orange-500/50 bg-orange-500/10",
  YELLOW: "text-yellow-500 border-yellow-500/50 bg-yellow-500/10",
  WHITE: "text-zinc-400 border-zinc-500/20 bg-zinc-500/5",
};

export function TaskListView({ filter, searchQuery }: TaskListViewProps) {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await axios.get("/api/tasks");
      return res.data;
    },
  });
  const { mutate: toggleTask, isPending: isToggling } = useMutation({
    mutationFn: async ({
      id,
      currentStatus,
    }: {
      id: string;
      currentStatus: boolean;
    }) => {
      await axios.patch(`/api/tasks?taskId=${id}`, {
        isCompleted: !currentStatus,
        status: !currentStatus ? "COMPLETED" : "PENDING",
      });
    },
    onSuccess: () => {
      toast.success("Task toggled successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to toggle task");
    },
  });
  //   const toggleTask = async (id: string, currentStatus: boolean) => {
  //     await axios.patch(`/api/tasks?taskId=${id}`, {
  //       isCompleted: !currentStatus,
  //       status: !currentStatus ? "COMPLETED" : "PENDING",
  //     });
  //     refetch();
  //   };
  const { mutate: deleteTask, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/tasks?taskId=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Filter Tasks
  const filteredTasks = tasks?.filter((t: Task) => {
    // 1. Search Filter
    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // 2. Sidebar Filter
    const today = new Date();
    // If filtering by COMPLETED, show only completed. Otherwise, hide completed.
    if (filter === "COMPLETED") {
      return t.isCompleted;
    }
    if (t.isCompleted) return false;

    switch (filter) {
      case "TODAY":
        return t.dueDate && isSameDay(new Date(t.dueDate), today);
      case "UPCOMING":
        return (
          t.dueDate &&
          isFuture(new Date(t.dueDate)) &&
          !isSameDay(new Date(t.dueDate), today)
        );
      case "OVERDUE":
        return (
          t.dueDate &&
          isPast(new Date(t.dueDate)) &&
          !isSameDay(new Date(t.dueDate), today)
        );
      case "ALL":
      default:
        return !t.isCompleted;
    }
  });

  if (!filteredTasks?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <p>No tasks found.</p>
      </div>
    );
  }

  // Sort: Priority (Red first) -> Date
  const PRIORITY_ORDER = { RED: 0, ORANGE: 1, YELLOW: 2, WHITE: 3 };
  filteredTasks.sort((a: Task, b: Task) => {
    const pDiff =
      PRIORITY_ORDER[a.priority || "WHITE"] -
      PRIORITY_ORDER[b.priority || "WHITE"];
    if (pDiff !== 0) return pDiff;
    if (a.dueDate && b.dueDate)
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    return 0;
  });

  return (
    <div className="space-y-3 pb-20">
      <AnimatePresence>
        {filteredTasks.map((task: Task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "group flex items-center gap-4 p-4 rounded-xl border transition-all relative overflow-hidden",
              "bg-zinc-900/50 hover:bg-zinc-900/80 border-white/5",
              PRIORITY_COLORS[task.priority || "WHITE"]
                .split(" ")[1]
                .replace("border-", "hover:border-") // Subtle hover effect matching priority
            )}
          >
            {/* Priority Indicator Strip */}
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                PRIORITY_COLORS[task.priority || "WHITE"]
                  .split(" ")[2]
                  .replace("bg-", "bg-")
              )}
            />

            <button
              onClick={() =>
                toggleTask({ id: task.id, currentStatus: task.isCompleted })
              }
              className="mt-0.5 shrink-0 z-10 cursor-pointer"
            >
              {isToggling ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : task.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              )}
            </button>

            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2 ">
                <span
                  className={cn(
                    "text-sm font-medium leading-tight truncate text-zinc-100",
                    task.isCompleted && "line-through text-zinc-500 opacity-50"
                  )}
                >
                  {task.title}
                </span>

                {/* Category Badge */}
                {task.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/5 uppercase tracking-wider">
                    {task.category.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-500">
                {task.dueDate && (
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      filter === "OVERDUE" ? "text-red-400" : ""
                    )}
                  >
                    <CalendarIcon className="h-3 w-3" />
                    <span>{format(new Date(task.dueDate), "MMM d")}</span>
                  </div>
                )}
                <div
                  className={cn(
                    "flex items-center gap-1",
                    PRIORITY_COLORS[task.priority || "WHITE"].split(" ")[0]
                  )}
                >
                  <Flag className="h-3 w-3 fill-current" />
                  <span>{task.xp} XP</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this task?")) {
                  deleteTask(task.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-500 hover:bg-white/5 rounded-full transition-all"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
