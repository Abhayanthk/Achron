"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
    },
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
  const { mutate: createCategory, isPending: isCreatingCategory } = useMutation(
    {
      mutationFn: async () => {
        return axios.post("/api/categories", { name: newCategoryName });
      },
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        setNewCategoryName("");
        setIsCategoryPopoverOpen(false);
        setCategoryId(res.data.id); // Auto-select new category
        toast.success("Category created");
      },
    }
  );

  // Delete Category Mutation
  const { mutate: deleteCategory } = useMutation({
    mutationFn: async (id: string) => {
      return axios.delete(`/api/categories?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      if (categoryId) setCategoryId(null);
      toast.success("Category deleted");
    },
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
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-white/5 bg-white/5">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Add New Task
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
              Task Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 h-12 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
                Due Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 text-white focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 h-10 scheme-dark"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
                Priority
              </label>
              <div className="flex gap-2">
                {[
                  {
                    id: "RED",
                    color: "bg-red-500",
                    ring: "ring-red-500",
                    xp: 300,
                  },
                  {
                    id: "ORANGE",
                    color: "bg-orange-500",
                    ring: "ring-orange-500",
                    xp: 200,
                  },
                  {
                    id: "YELLOW",
                    color: "bg-yellow-500",
                    ring: "ring-yellow-500",
                    xp: 100,
                  },
                  {
                    id: "WHITE",
                    color: "bg-zinc-200",
                    ring: "ring-zinc-200",
                    xp: 50,
                  },
                ].map((flag) => (
                  <div
                    key={flag.id}
                    className={`cursor-pointer h-10 w-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                      priority === flag.id
                        ? `border-transparent ${flag.color} shadow-lg scale-105`
                        : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                    onClick={() => setPriority(flag.id)}
                    title={`${flag.xp} XP`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full ${
                        priority === flag.id ? "bg-white" : flag.color
                      } shadow-sm`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
              Category
            </label>
            <div className="flex gap-2 flex-wrap p-3 rounded-xl bg-zinc-900/30 border border-white/5 min-h-[60px]">
              {categories?.map((cat: any) => (
                <div
                  key={cat.id}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    categoryId === cat.id
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                  onClick={() =>
                    setCategoryId(cat.id === categoryId ? null : cat.id)
                  }
                >
                  <span className="max-w-[100px] truncate">{cat.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCategory(cat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 hover:text-red-500 rounded transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <Popover
                open={isCategoryPopoverOpen}
                onOpenChange={setIsCategoryPopoverOpen}
              >
                <PopoverTrigger asChild>
                  {/* `asChild` lets Radix attach Popover trigger behavior directly to this button */}

                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-zinc-800 text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors bg-white/5 hover:bg-white/10"
                  >
                    <Plus className="h-3 w-3" />
                    New
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 p-3 bg-zinc-950 border-zinc-800"
                  align="start"
                >
                  <div className="flex gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="h-8 text-xs bg-zinc-900 border-zinc-800 text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          createCategory();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 bg-emerald-500 hover:bg-emerald-600 text-black font-medium"
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

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !title || !categoryId || !date}
              className="bg-white text-black hover:bg-zinc-200 font-semibold shadow-lg shadow-white/10"
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
