"use client";

import { useState } from "react";
import { Plus, Infinity, Swords, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function CreateHabitDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"endless" | "training">("endless");
  const [targetDays, setTargetDays] = useState("21");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      await axios.post("/api/habits", {
        name,
        targetDays: mode === "training" ? parseInt(targetDays) : null,
      });
      toast.success("New Quest Started!");
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setOpen(false);
      setName("");
      setMode("endless");
      setTargetDays("21");
    } catch (error) {
      toast.error("Failed to create habit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-white text-black hover:bg-zinc-200 border-0 font-medium transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
          <Plus className="w-4 h-4" /> New Quest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950/95 border-zinc-800 text-zinc-100 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Begin a New Quest
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Choose your path to mastery.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8 pt-4">
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Quest Title
            </Label>
            <Input
              id="name"
              placeholder="e.g., Morning Meditation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 text-lg h-12 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 transition-all"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Quest Type
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode("endless")}
                className={cn(
                  "relative p-4 rounded-xl border text-left transition-all duration-300 flex flex-col gap-2",
                  mode === "endless"
                    ? "bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
                    : "bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg w-fit",
                    mode === "endless"
                      ? "bg-blue-500 text-white"
                      : "bg-zinc-800 text-zinc-400"
                  )}
                >
                  <Infinity className="size-5" />
                </div>
                <div>
                  <div
                    className={cn(
                      "font-semibold",
                      mode === "endless" ? "text-blue-400" : "text-zinc-300"
                    )}
                  >
                    Endless Journey
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Daily habit with no end date. Build a lifestyle.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("training")}
                className={cn(
                  "relative p-4 rounded-xl border text-left transition-all duration-300 flex flex-col gap-2",
                  mode === "training"
                    ? "bg-purple-600/10 border-purple-500/50 shadow-[0_0_20px_rgba(147,51,234,0.1)]"
                    : "bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg w-fit",
                    mode === "training"
                      ? "bg-purple-500 text-white"
                      : "bg-zinc-800 text-zinc-400"
                  )}
                >
                  <Swords className="size-5" />
                </div>
                <div>
                  <div
                    className={cn(
                      "font-semibold",
                      mode === "training" ? "text-purple-400" : "text-zinc-300"
                    )}
                  >
                    Training Arc
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Fixed duration challenge. Complete a specific goal.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {mode === "training" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <Label
                htmlFor="days"
                className="text-xs font-semibold text-zinc-500 uppercase tracking-widest"
              >
                Duration (Days)
              </Label>
              <Input
                id="days"
                type="number"
                min="1"
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 focus-visible:ring-purple-500/50 transition-all"
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-11 text-base font-medium transition-all shadow-lg",
                mode === "endless"
                  ? "bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/25"
                  : "bg-purple-600 hover:bg-purple-500 hover:shadow-purple-500/25"
              )}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Start Quest"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
