"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface CreateTimerDialogProps {
  addPreset: (preset: {
    name: string;
    duration: number;
    type: string;
    color: string;
  }) => Promise<any>;
}

export default function CreateTimerDialog({
  addPreset,
}: CreateTimerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-zinc-800 bg-transparent hover:bg-zinc-900/30 hover:border-zinc-700 transition-all text-zinc-500 hover:text-zinc-300 h-[88px]">
          <Plus className="size-6 mb-2 opacity-50" />
          <span className="text-xs font-medium">Add Custom</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Create Custom Timer</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const promise = addPreset({
              name: formData.get("name") as string,
              duration: parseInt(formData.get("duration") as string) * 60,
              type: formData.get("type") as string,
              color: formData.get("color") as string,
            });

            toast.promise(promise, {
              loading: "Creating timer...",
              success: () => {
                setOpen(false);
                return "Timer created";
              },
              error: "Failed to create timer",
            });
          }}
          className="space-y-4 pt-4"
        >
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Name</label>
            <Input
              name="name"
              placeholder="e.g. Deep Work Session"
              className="bg-zinc-900 border-zinc-800"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">
              Duration (minutes)
            </label>
            <Input
              name="duration"
              type="number"
              placeholder="25"
              className="bg-zinc-900 border-zinc-800"
              required
              min="1"
              max="180"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Type</label>
            <select
              name="type"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="DEEP WORK">Deep Work</option>
              <option value="FLOW">Flow</option>
              <option value="CODING">Coding</option>
              <option value="LEARNING">Learning</option>
              <option value="WRITING">Writing</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Color</label>
            <div className="flex gap-2">
              {[
                "bg-blue-500",
                "bg-purple-500",
                "bg-emerald-500",
                "bg-amber-500",
                "bg-pink-500",
                "bg-rose-500",
                "bg-cyan-500",
              ].map((color) => (
                <label key={color} className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    className="peer sr-only"
                    defaultChecked={color === "bg-blue-500"}
                  />
                  <div
                    className={`w-6 h-6 rounded-full ${color} opacity-50 peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-white peer-checked:ring-offset-2 peer-checked:ring-offset-zinc-950 transition-all hover:opacity-80`}
                  ></div>
                </label>
              ))}
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-white text-black hover:bg-zinc-200"
          >
            Create Preset
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
