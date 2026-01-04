"use client";

import { useState, useEffect, Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskListView } from "@/components/tasks/task-list-view";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import { useSearchParams, useRouter } from "next/navigation";

function TasksContent() {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "TODAY" | "UPCOMING" | "OVERDUE" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsAddTaskOpen(true);
    }
  }, [searchParams]);

  return (
    <div className="h-full flex overflow-hidden">
        {/* Left Sidebar for Filters */}
        <div className="w-64 shrink-0 border-r border-white/5 p-6 flex flex-col gap-6 bg-zinc-950/30">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white mb-6">Tasks</h1>
                <Button className="w-full justify-start" onClick={() => setIsAddTaskOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                </Button>
            </div>

            <div className="space-y-1">
                {[
                    { id: "ALL", label: "Overview" },
                    { id: "TODAY", label: "Today's Focus" },
                    { id: "UPCOMING", label: "Upcoming" },
                    { id: "OVERDUE", label: "Overdue" },
                    { id: "COMPLETED", label: "Completed" }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setFilter(item.id as any)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === item.id ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent">
            {/* Header / Search */}
            <div className="h-16 border-b border-white/5 flex items-center px-8 justify-between gap-4">
                <input 
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500 w-full max-w-md"
                />
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-2xl">
                    <h2 className="text-lg font-medium text-white mb-6">
                        {filter === "ALL" && "All Tasks"}
                        {filter === "TODAY" && "Today's Focus"}
                        {filter === "UPCOMING" && "Upcoming Tasks"}
                        {filter === "OVERDUE" && "Overdue Tasks"}
                        {filter === "COMPLETED" && "Completed Tasks"}
                    </h2>
                    <TaskListView filter={filter} searchQuery={searchQuery} />
                </div>
            </div>
        </div>

      <AddTaskDialog 
        open={isAddTaskOpen} 
        onOpenChange={setIsAddTaskOpen} 
      />
    </div>
  );
}

export default function TasksPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TasksContent />
        </Suspense>
    )
}
