"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Plus, BrainCircuit, ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Brainstorm {
  id: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface BrainstormListProps {
  projectId: string;
  brainstorms: Brainstorm[];
}

export function BrainstormList({
  projectId,
  brainstorms,
}: BrainstormListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBrainstormName, setNewBrainstormName] = useState("");

  const { mutate: createBrainstorm, isPending } = useMutation({
    mutationFn: async (name: string) => {
      const res = await axios.post(`/api/projects/${projectId}/brainstorm`, {
        name: name || "Untitled Brainstorm",
      });
      return res.data;
    },
    onSuccess: (data) => {
      setIsDialogOpen(false);
      setNewBrainstormName("");
      toast.success("Brainstorm created successfully!");
      router.push(`/projects/${projectId}/brainstorm/${data.id}`);
    },
    onError: () => {
      toast.error("Failed to create brainstorm.");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createBrainstorm(newBrainstormName);
  };

  return (
    <div className="p-6 h-full overflow-y-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create New Card */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all duration-500 h-[220px] flex flex-col items-center justify-center backdrop-blur-sm"
            >
              {/* Dynamic Gradient Border/Glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-indigo-500/50 to-transparent" />
                <div className="absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
              </div>

              <div className="relative z-10 flex flex-col items-center text-center p-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative h-14 w-14 rounded-2xl bg-linear-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-500">
                    <Plus className="h-6 w-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>

                <h3 className="text-lg font-medium text-zinc-200 group-hover:text-white transition-colors">
                  New Canvas
                </h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-[200px] group-hover:text-zinc-400 transition-colors">
                  Start fresh with an infinite whiteboard
                </p>
              </div>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Wand2 className="h-5 w-5 text-indigo-400" />
                Name your creation
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-base">
                Every great idea needs a name. What are we brainstorming today?
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-zinc-300 text-sm font-medium"
                >
                  Brainstorm Name
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    value={newBrainstormName}
                    onChange={(e) => setNewBrainstormName(e.target.value)}
                    placeholder="e.g. Q4 Marketing Campaign"
                    className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl h-11 pl-4"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Sparkles className="h-4 w-4 text-indigo-500/50" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-zinc-400 hover:text-zinc-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !newBrainstormName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] transition-all"
                >
                  {isPending ? (
                    <>Creating...</>
                  ) : (
                    <>
                      Create Brainstorm <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Existing Brainstorms */}
        {brainstorms.map((brainstorm) => (
          <motion.div
            key={brainstorm.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            onClick={() =>
              router.push(`/projects/${projectId}/brainstorm/${brainstorm.id}`)
            }
            className="group relative cursor-pointer"
          >
            {/* Main Card Container */}
            <div className="h-[220px] flex flex-col bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:bg-zinc-900/60 transition-all duration-500 relative">
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-linear-to-br from-indigo-500/0 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Top Section */}
              <div className="p-6 flex-1 relative z-10 flex flex-col items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-white/5 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/10 transition-all duration-300">
                  <BrainCircuit className="h-6 w-6 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                </div>

                <div className="w-full">
                  <h3 className="text-lg font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                    {brainstorm.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 py-0.5" />
                    Edited {formatDistanceToNow(new Date(brainstorm.updatedAt))}{" "}
                    ago
                  </p>
                </div>
              </div>

              {/* Bottom/Action Section */}
              <div className="px-6 py-4 border-t border-white/5 bg-zinc-950/20 flex items-center justify-between group-hover:bg-zinc-950/40 transition-colors relative z-10">
                <span className="text-xs text-zinc-600 font-medium group-hover:text-zinc-400 transition-colors">
                  Infinite Canvas
                </span>

                <button className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 transform group-hover:scale-110">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Decorative Glow */}
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700 opacity-50" />
              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700 opacity-50" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
