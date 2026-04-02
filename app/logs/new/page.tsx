"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
const BlockEditor = dynamic(
  () => import("@/components/ui/block-editor").then((mod) => mod.BlockEditor),
  { ssr: false },
);
import { type BlockEditorHandle } from "@/components/ui/block-editor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

function LogSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-4">
        {/* Title Skeleton */}
        <Skeleton className="h-14 w-3/4 bg-white/5" />
        {/* Meta Skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-8 w-32 rounded-full bg-white/5" />
          <Skeleton className="h-8 w-24 rounded-full bg-white/5" />
          <Skeleton className="h-8 w-24 rounded-full bg-white/5" />
        </div>
      </div>
      {/* Content Skeleton blocks */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-4 w-full bg-white/5" />
        <Skeleton className="h-4 w-5/6 bg-white/5" />
        <Skeleton className="h-4 w-full bg-white/5" />
        <Skeleton className="h-4 w-2/3 bg-white/5" />
        <div className="pt-4 space-y-4">
          <Skeleton className="h-4 w-full bg-white/5" />
          <Skeleton className="h-4 w-4/5 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

function NewLogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Category Creation State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const blockEditorRef = useRef<BlockEditorHandle>(null);

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axios.get("/api/categories");
      return res.data;
    },
  });

  // Fetch Log for Edit
  const { data: existingLog, isLoading: isLoadingLog } = useQuery({
    queryKey: ["log", editId],
    queryFn: async () => {
      if (!editId) return null;
      const res = await axios.get(`/api/logs?id=${editId}`);
      return res.data[0]; // findMany returns array
    },
    enabled: !!editId,
  });

  const isLoading = (!!editId && isLoadingLog) || false;

  useEffect(() => {
    if (existingLog) {
      setTitle(existingLog.title);
      setContent(existingLog.content);
      setDate(format(new Date(existingLog.date), "yyyy-MM-dd"));
      setCategoryId(existingLog.categoryId || null);
    }
  }, [existingLog]);

  // Mutations
  const { mutate: saveLog, isPending } = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        content,
        // Only send date on CREATE. On EDIT, we don't send it so it's preserved.
        ...(editId ? {} : { date: new Date(date) }),
        categoryId: categoryId === "none" ? null : categoryId,
      };

      if (editId) {
        return axios.patch(`/api/logs?logId=${editId}`, payload);
      } else {
        return axios.post("/api/logs", payload);
      }
    },
    onSuccess: () => {
      toast.success("Log saved successfully");
      router.push("/logs");
    },
    onError: () => {
      toast.error("Failed to save log");
    },
  });

  const { mutate: createCategory, isPending: isCreatingCategory } = useMutation(
    {
      mutationFn: async () => {
        return axios.post("/api/categories", { name: newCategoryName });
      },
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        setNewCategoryName("");
        setIsCategoryPopoverOpen(false);
        setCategoryId(res.data.id);
        toast.success("Category created");
      },
    },
  );

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

  // Toolbar Handlers removed as BlockNote has its own

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Ambient */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white pl-0 gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-sm">
              {editId
                ? "Editing Entry"
                : format(new Date(date), "EEEE, MMMM d")}
            </span>
          </div>
        </div>

        {/* Editor Area */}
        {isLoading ? (
          <LogSkeleton />
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              {/* Title Input (No Box) */}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title your entry..."
                className="text-5xl font-bold bg-transparent border-none placeholder:text-zinc-700 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 tracking-tight"
              />

              {/* Meta Controls */}
              <div className="flex flex-wrap items-center gap-4 text-zinc-500">
                {/* Date Picker */}
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:bg-white/10 transition-colors">
                  <Calendar className="size-4" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={!!editId}
                    className="bg-transparent border-none text-sm text-zinc-300 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert disabled:opacity-50"
                  />
                </div>

                {/* Category Picker */}
                <div className="flex gap-2 flex-wrap items-center">
                  {categories?.map((cat: any) => (
                    <div
                      key={cat.id}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-all ${categoryId === cat.id ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50" : "bg-transparent border-white/10 hover:bg-white/5 text-zinc-400"}`}
                      onClick={() =>
                        setCategoryId(cat.id === categoryId ? null : cat.id)
                      }
                    >
                      <span>{cat.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCategory(cat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-all"
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
                      <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-white/20 text-sm text-zinc-500 hover:text-white hover:border-white/40 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Category
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-64 p-3 border-white/10 bg-zinc-900"
                      align="start"
                    >
                      <div className="flex gap-2">
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Category name"
                          className="h-8 text-sm bg-zinc-800 border-zinc-700 scheme-dark text-white"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              createCategory();
                            }
                          }}
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
            </div>

            {/* Content Area (BlockNote) */}
            <div className="min-h-[60vh] prose prose-invert max-w-none">
              <BlockEditor
                key={editId ? `edit-${editId}` : "new"}
                ref={blockEditorRef}
                initialContent={existingLog?.content}
                onChange={(blocks) => setContent(JSON.stringify(blocks))}
              />
            </div>

            <div className="fixed bottom-8 right-8 animate-in zoom-in duration-300">
              <Button
                size="lg"
                onClick={() => saveLog()}
                disabled={!title || isPending}
                className="bg-white text-black hover:bg-zinc-200 shadow-xl rounded-full px-8 h-14"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                {editId ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewLogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <NewLogContent />
    </Suspense>
  );
}
