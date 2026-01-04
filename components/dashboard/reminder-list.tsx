"use client";

import { useState } from "react";
import { Plus, X, Layout, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Reminder {
  id: string;
  content: string;
  createdAt: string;
}

export function ReminderList() {
  const [isAdding, setIsAdding] = useState(false);
  const [newReminder, setNewReminder] = useState("");
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const res = await axios.get("/api/reminders");
      return res.data;
    },
  });

  const createReminder = useMutation({
    mutationFn: async (content: string) => {
      await axios.post("/api/reminders", { content });
    },
    onSuccess: () => {
      toast("Reminder created successfully");
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      setNewReminder("");
      setIsAdding(false);
    },
    onError: () => {
      toast("Failed to create reminder", { 
        duration: 5000,
        
       });
    },
  });

  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/reminders/${id}`);
    },
    onSuccess: () => {
      toast("Reminder deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
    onError: () => {
      toast("Failed to delete reminder", { 
        duration: 5000,
        
       });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.trim()) return;
    createReminder.mutate(newReminder);
  };

  return (
    <div className="flex flex-col h-full">
        {/* Header / Empty State Action */}
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-zinc-400">
                <Layout className="size-4" />
                <span className="text-xs font-medium">Quick Reminders</span>
            </div>
            {!isAdding && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 hover:bg-white/10"
                    onClick={() => setIsAdding(true)}
                >
                    <Plus className="size-4 text-zinc-400" />
                </Button>
            )}
        </div>

        {/* Add Form */}
        {isAdding && (
            <form onSubmit={handleSubmit} className="mb-3 flex items-center gap-2">
                <Input
                    autoFocus
                    value={newReminder}
                    onChange={(e) => setNewReminder(e.target.value)}
                    placeholder="Type..."
                    className="h-7 text-xs bg-white/60 border-white/10 focus-visible:ring-offset-0 focus-visible:ring-1"
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    className="h-7 w-7 shrink-0" 
                    disabled={createReminder.isPending}
                 >
                    {createReminder.isPending ? <Loader2 className="size-3 animate-spin"/> : <Plus className="size-3" />}
                </Button>
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 shrink-0" 
                    onClick={() => setIsAdding(false)}
                >
                    <X className="size-3" />
                </Button>
            </form>
        )}

        {/* List */}
        <ScrollArea className="flex-1 -mr-2 pr-2">
            {isLoading ? (
                 <div className="flex flex-col gap-2 mt-2">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-8 animate-pulse bg-white/5 rounded-md" />
                    ))}
                 </div>
            ) : reminders.length === 0 && !isAdding ? (
                 <div className="flex flex-col items-center justify-center h-full py-8 text-center opacity-60">
                    <p className="text-xs text-zinc-500">No active reminders</p>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-400" onClick={() => setIsAdding(true)}>Create one</Button>
                 </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {reminders.map((reminder: Reminder) => (
                        <div 
                            key={reminder.id} 
                            className="group flex items-center justify-between gap-2 p-2 rounded-md bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                        >
                            <span className="text-xs text-zinc-300 break-all line-clamp-2">{reminder.content}</span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                onClick={() => deleteReminder.mutate(reminder.id)}
                                disabled={deleteReminder.isPending}
                            >
                                <X className="size-3 text-zinc-500 hover:text-red-400 transition-colors" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
    </div>
  );
}
