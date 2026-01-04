"use client"

import { Clock, Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

export function TaskList() {
  const router = useRouter()
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", "dashboard"],
    queryFn: async () => {
      // Fetch only upcoming/pending tasks, limit 3
      const res = await axios.get("/api/tasks")
      return res.data.slice(0, 3) 
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-medium text-zinc-400">Top Priorities</h3>
          <button 
            onClick={() => router.push("/tasks?action=new")}
            className="p-1 hover:bg-white/10 rounded-md transition-colors"
          >
              <Plus className="h-4 w-4 text-zinc-400" />
          </button>
      </div>

      {isLoading ? (
         <div className="flex justify-center py-4">
             <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
         </div>
      ) : tasks?.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-4">
              No pending tasks
          </div>
      ) : (
          tasks?.map((task: any) => (
            <div key={task.id} className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
              <div className="mt-1 flex size-2 items-center justify-center">
                <div className={`size-2 rounded-full ${task.status === 'PENDING' ? 'bg-amber-500' : 'bg-green-500'}`} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-zinc-200 line-clamp-1">{task.title}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Clock className="size-3" />
                  <span>
                    {task.startTime 
                        ? format(new Date(task.startTime), "h:mm a") 
                        : (task.dueDate ? format(new Date(task.dueDate), "MMM d") : "No due date")}
                  </span>
                </div>
              </div>
            </div>
          ))
      )}
       <button 
        onClick={() => router.push("/tasks")}
        className="w-full text-center text-xs text-zinc-500 hover:text-white transition-colors pt-2"
       >
            View All Tasks
        </button>
    </div>
  )
}
