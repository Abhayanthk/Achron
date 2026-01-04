"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priority, setPriority] = useState("WHITE");
  
  // New Category State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);

  // Fetch Categories
  const { data: categories } = useQuery({
      queryKey: ["categories"],
      queryFn: async () => {
          const res = await axios.get("/api/categories");
          return res.data;
      }
  });

  // Create Task Mutation
  const { mutate: createTask, isPending: isCreating } = useMutation({
    mutationFn: async () => {
       // Only basics: Title, Date, Category
      return axios.post("/api/tasks", {
        title,
        dueDate: date ? new Date(date).toISOString() : null,
        categoryId: categoryId === "none" ? null : categoryId,
        priority, // Defaults to white on backend if missing, but we send it
      });
    },
    onSuccess: () => {
      toast.success("Task added successfully!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to add task.");
    },
  });

  // Create Category Mutation
  const { mutate: createCategory, isPending: isCreatingCategory } = useMutation({
      mutationFn: async () => {
          return axios.post("/api/categories", { name: newCategoryName });
      },
      onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: ["categories"] });
          setNewCategoryName("");
          setIsCategoryPopoverOpen(false);
          setCategoryId(res.data.id); // Auto-select new category
          toast.success("Category created");
      }
  });

  // Delete Category Mutation
  const { mutate: deleteCategory } = useMutation({
      mutationFn: async (id: string) => {
          return axios.delete(`/api/categories?id=${id}`);
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["categories"] });
          if (categoryId) setCategoryId(null);
          toast.success("Category deleted");
      }
  });

  const resetForm = () => {
    setTitle("");
    setDate("");
    setCategoryId(null);
    setPriority("WHITE");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    createTask();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="What needs to be done?"
            />
          </div>
          
          <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                />
          </div>

          <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <div className="flex gap-2 flex-wrap">
                  {categories?.map((cat: any) => (
                      <div key={cat.id} className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${categoryId === cat.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-white/10 hover:bg-white/5'}`}
                           onClick={() => setCategoryId(cat.id === categoryId ? null : cat.id)}
                      >
                          <span>{cat.name}</span>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-all"
                          >
                              <Trash2 className="h-3 w-3" />
                          </button>
                      </div>
                  ))}
                  
                  <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-white/20 text-sm text-zinc-400 hover:text-white hover:border-white/40 transition-colors">
                            <Plus className="h-3 w-3" />
                            New Category
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="start">
                          <div className="flex gap-2">
                              <Input 
                                  value={newCategoryName} 
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                  placeholder="Category name"
                                  className="h-8 text-sm"
                                  onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); createCategory(); }}}
                              />
                              <Button 
                                size="sm" 
                                className="h-8" 
                                onClick={() => createCategory()}
                                disabled={!newCategoryName || isCreatingCategory}
                              >
                                  Add
                              </Button>
                          </div>
                      </PopoverContent>
                  </Popover>
              </div>
          </div>

          <div className="space-y-2">
              <label className="text-sm font-medium">Priority Flag</label>
              <div className="flex gap-3">
                  {[
                      { id: "RED", color: "bg-red-500", xp: 300, label: "Critical" },
                      { id: "ORANGE", color: "bg-orange-500", xp: 200, label: "High" },
                      { id: "YELLOW", color: "bg-yellow-500", xp: 100, label: "Medium" },
                      { id: "WHITE", color: "bg-white", xp: 50, label: "Normal" }
                  ].map((flag) => (
                      <div 
                        key={flag.id}
                        className={`cursor-pointer rounded-lg p-3 border-2 transition-all flex flex-col items-center gap-1 min-w-[80px] ${priority === flag.id ? 'border-primary bg-primary/10' : 'border-transparent bg-white/5 hover:bg-white/10'}`}
                        onClick={() => setPriority(flag.id)}
                      >
                          <div className={`h-4 w-4 rounded-full ${flag.color} shadow-sm shadow-white/20`} />
                          <span className="text-xs font-medium text-zinc-300">{flag.xp} XP</span>
                      </div>
                  ))}
              </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !title}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
