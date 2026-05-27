"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { TimerPreset } from "@/components/providers/timer-context";

interface EditTimerDialogProps {
  preset: TimerPreset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Partial<Omit<TimerPreset, "id">>) => Promise<any>;
}

export default function EditTimerDialog({
  preset,
  open,
  onOpenChange,
  onSave,
}: EditTimerDialogProps) {
  const [name, setName] = useState(preset.name);
  const [duration, setDuration] = useState(
    String(Math.floor(preset.duration / 60)),
  );
  const [type, setType] = useState(preset.type);
  const [color, setColor] = useState(preset.color);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(preset.name);
    setDuration(String(Math.floor(preset.duration / 60)));
    setType(preset.type);
    setColor(preset.color);
  }, [preset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const promise = onSave(preset.id, {
      name,
      duration: parseInt(duration) * 60,
      type,
      color,
    });

    toast.promise(promise, {
      loading: "Updating timer...",
      success: () => {
        onOpenChange(false);
        return "Timer updated";
      },
      error: "Failed to update timer",
    });

    try {
      await promise;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Edit Timer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
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
              value={type}
              onChange={(e) => setType(e.target.value)}
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
              ].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full ${c} transition-all hover:opacity-80 ${
                    color === c
                      ? "opacity-100 ring-2 ring-white ring-offset-2 ring-offset-zinc-950"
                      : "opacity-50"
                  }`}
                />
              ))}
            </div>
          </div>
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-white text-black hover:bg-zinc-200"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
