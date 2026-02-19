"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { CalendarEvent, Category } from "@prisma/client";
import axios from "axios";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: any) => void;
  initialDate?: Date;
  initialEvent?: any; // For editing
  onDelete?: () => void;
}

const COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
];

export function CreateEventDialog({
  open,
  onOpenChange,
  onSave,
  initialDate,
  initialEvent,
  onDelete,
}: CreateEventDialogProps) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [recurrence, setRecurrence] = useState("NONE");
  const [color, setColor] = useState(COLORS[0]);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Fetch categories
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get("/api/categories");
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (open) {
      if (initialEvent) {
        setTitle(initialEvent.title);
        setStart(format(new Date(initialEvent.start), "yyyy-MM-dd'T'HH:mm"));
        setEnd(format(new Date(initialEvent.end), "yyyy-MM-dd'T'HH:mm"));
        setAllDay(initialEvent.allDay || false);
        setIsCompleted(initialEvent.isCompleted || false);
        setRecurrence(initialEvent.recurrence || "NONE");
        setColor(initialEvent.color || COLORS[0]);
        setCategoryId(initialEvent.categoryId || undefined);
      } else {
        setTitle("");
        // Default start to nearest hour or initialDate

        const baseDate = initialDate || new Date();
        const startDate = new Date(baseDate);
        startDate.setMinutes(0, 0, 0); // Reset minutes/seconds

        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);

        setStart(format(startDate, "yyyy-MM-dd'T'HH:mm"));
        setEnd(format(endDate, "yyyy-MM-dd'T'HH:mm"));
        setAllDay(false);
        setIsCompleted(false);
        setRecurrence("NONE");
        setColor(COLORS[0]);
        setCategoryId(undefined);
      }
    }
  }, [open, initialEvent, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) {
      alert("Please select both start and end dates.");
      return;
    }
    onSave({
      id: initialEvent?.id,
      title,
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(),
      allDay,
      isCompleted,
      recurrence,
      color,
      categoryId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>
            {initialEvent ? "Edit Event" : "Create Event"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3 bg-zinc-900 border-white/10"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start" className="text-right">
              Start
            </Label>
            <Input
              id="start"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="col-span-3 bg-zinc-900 border-white/10"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end" className="text-right">
              End
            </Label>
            <Input
              id="end"
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="col-span-3 bg-zinc-900 border-white/10"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="allDay" className="text-right">
              All Day
            </Label>
            <Switch id="allDay" checked={allDay} onCheckedChange={setAllDay} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isCompleted" className="text-right">
              Completed
            </Label>
            <Switch
              id="isCompleted"
              checked={isCompleted}
              onCheckedChange={setIsCompleted}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recurrence" className="text-right">
              Repeat
            </Label>
            <select
              id="recurrence"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="col-span-3 flex h-9 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="NONE">Does not repeat</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <select
              id="category"
              value={categoryId || ""}
              onChange={(e) => setCategoryId(e.target.value || undefined)}
              className="col-span-3 flex h-9 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Color</Label>
            <div className="col-span-3 flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border border-white/10 ${
                    color === c ? "ring-2 ring-white" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            {initialEvent && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this event?")) {
                    onDelete?.();
                  }
                }}
              >
                Delete
              </Button>
            )}
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
