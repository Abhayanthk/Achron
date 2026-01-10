"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditSectionDialogProps {
  section: {
    id: string;
    title: string;
    startDate?: string | null;
    endDate?: string | null;
    color?: string | null;
  };
  onConfirm: (data: {
    title: string;
    color: string;
    startDate?: string | null;
    endDate?: string | null;
  }) => Promise<void>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSectionDialog({
  section,
  onConfirm,
  isOpen,
  onOpenChange,
}: EditSectionDialogProps) {
  const [title, setTitle] = useState(section.title);
  const [color, setColor] = useState(section.color || "#3b82f6");
  const [startDate, setStartDate] = useState<string | null>(
    section.startDate || null
  );
  const [endDate, setEndDate] = useState<string | null>(
    section.endDate || null
  );
  const [isLoading, setIsLoading] = useState(false);

  const COLORS = [
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
  ];

  const handleSubmit = async () => {
    if (!title) return;
    setIsLoading(true);
    try {
      await onConfirm({ title, color, startDate, endDate });
      onOpenChange(false);
    } catch {
      // handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Planning Phase"
              className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/10"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">
                Start Date
              </label>
              <input
                type="date"
                value={
                  startDate
                    ? new Date(startDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setStartDate(
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null
                  )
                }
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/10 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">
                End Date
              </label>
              <input
                type="date"
                value={
                  endDate ? new Date(endDate).toISOString().split("T")[0] : ""
                }
                onChange={(e) =>
                  setEndDate(
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null
                  )
                }
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/10 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">
              Color Tag
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-all",
                    color === c
                      ? "border-white scale-110"
                      : "border-transparent hover:scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            disabled={!title || isLoading}
            onClick={handleSubmit}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
