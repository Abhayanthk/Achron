"use client";

import { useMemo, useState, useRef } from "react";
import {
  format,
  eachDayOfInterval,
  addDays,
  differenceInDays,
  isSameDay,
  startOfDay,
} from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { EditSectionDialog } from "./edit-section-dialog";
import { DraggableSection } from "./draggable-section";

interface Task {
  id: string;
  title: string;
  startDate?: string | null;
  sectionId?: string | null;
}

interface Section {
  id: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  color?: string | null;
  status: string; // "ACTIVE" | "COMPLETED"
  tasks: Task[];
}

interface TimelineViewProps {
  sections: Section[];
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  projectColor: string;
}

export function TimelineView({
  sections,
  projectStartDate,
  projectEndDate,
  projectColor,
}: TimelineViewProps) {
  const queryClient = useQueryClient();

  // View State
  const [viewStartDate, setViewStartDate] = useState(() =>
    projectStartDate ? new Date(projectStartDate) : addDays(new Date(), -2)
  );

  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const DAYS_TO_RENDER = 45;
  const DAY_WIDTH = 60;

  // Navigation
  const shiftView = (days: number) => {
    setViewStartDate((prev) => addDays(prev, days));
  };

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: viewStartDate,
      end: addDays(viewStartDate, DAYS_TO_RENDER - 1),
    });
  }, [viewStartDate]);

  const GRID_START_DATE = startOfDay(viewStartDate);

  // -- Mutations --
  const { mutate: updateSection } = useMutation({
    mutationFn: async (data: {
      id: string;
      startDate?: string | null;
      endDate?: string | null;
      title?: string;
      color?: string;
    }) => {
      await axios.patch("/api/projects/sections", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
    onError: () => toast.error("Failed to update section"),
  });

  // -- Helpers --
  const getPosition = (dateStr?: string | null, endDateStr?: string | null) => {
    if (!dateStr) return { left: 0, width: 0, visible: false };

    const start = startOfDay(new Date(dateStr));
    const end = endDateStr ? startOfDay(new Date(endDateStr)) : start;

    const offsetDays = differenceInDays(start, GRID_START_DATE);
    const durationDays = differenceInDays(end, start) + 1;

    return {
      left: offsetDays * DAY_WIDTH,
      width: Math.max(durationDays * DAY_WIDTH, DAY_WIDTH),
      visible: true,
    };
  };

  const handleDragEnd = (sectionId: string, info: any) => {
    const movePx = info.offset.x;
    const moveDays = Math.round(movePx / DAY_WIDTH);

    if (moveDays === 0) return;

    const section = sections.find((s) => s.id === sectionId);
    if (!section?.startDate) return;

    const newStart = addDays(new Date(section.startDate), moveDays);
    const currentDuration = section.endDate
      ? differenceInDays(new Date(section.endDate), new Date(section.startDate))
      : 0;
    const newEnd = addDays(newStart, currentDuration);

    updateSection({
      id: sectionId,
      startDate: newStart.toISOString(),
      endDate: newEnd.toISOString(),
    });
  };

  const handleResizeEnd = (sectionId: string, info: any) => {
    const resizePx = info.offset.x;
    const addedDays = Math.round(resizePx / DAY_WIDTH);

    if (addedDays === 0) return;

    const section = sections.find((s) => s.id === sectionId);
    if (!section?.startDate) return;

    const currentEnd = section.endDate
      ? new Date(section.endDate)
      : new Date(section.startDate);
    const newEnd = addDays(currentEnd, addedDays);

    if (differenceInDays(newEnd, new Date(section.startDate)) < 0) return;

    updateSection({
      id: sectionId,
      endDate: newEnd.toISOString(),
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] relative select-none overflow-hidden">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, white 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Header & Controls */}
      <div className="flex-none h-14 border-b border-white/5 bg-zinc-900/50 backdrop-blur-sm z-30 flex items-center justify-between pl-4 pr-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftView(-7)}
            className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewStartDate(new Date())}
            className="text-xs font-medium px-2 py-1 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => shiftView(7)}
            className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="text-sm font-medium text-zinc-300">
          {format(addDays(viewStartDate, 5), "MMMM yyyy")}
        </div>

        <div className="w-10" />
      </div>

      {/* Date Header Row */}
      <div className="flex-none h-10 border-b border-white/5 bg-zinc-900/30 backdrop-blur-sm z-20 flex relative overflow-hidden">
        <div className="flex" style={{ width: days.length * DAY_WIDTH }}>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              style={{ width: DAY_WIDTH }}
              className={cn(
                "flex-none flex flex-col items-center justify-center border-r border-white/5 text-[10px] uppercase font-medium",
                isSameDay(day, new Date())
                  ? "text-emerald-400 bg-emerald-500/5"
                  : "text-zinc-500"
              )}
            >
              <span>{format(day, "d")}</span>
              <span className="opacity-50 text-[9px]">{format(day, "EE")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 overflow-hidden relative">
        <div
          style={{ width: days.length * DAY_WIDTH }}
          className="relative h-full"
        >
          {/* Vertical Lines */}
          <div className="absolute inset-0 flex pointer-events-none">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                style={{ width: DAY_WIDTH }}
                className={cn(
                  "border-r border-white/5 h-full flex-none",
                  isSameDay(day, new Date()) && "bg-emerald-500/5"
                )}
              />
            ))}
          </div>

          {/* Sections */}
          <div className="py-4 space-y-4 relative z-10 box-border">
            {sections.map((section) => {
              const pos = getPosition(section.startDate, section.endDate);
              const isCompleted = section.status === "COMPLETED";

              if (!section.startDate) return null;

              return (
                <div key={section.id} className="relative h-8 group w-full">
                  {section.startDate ? (
                    <DraggableSection
                      key={section.id}
                      section={section}
                      projectColor={projectColor}
                      isCompleted={isCompleted}
                      pos={pos}
                      dayWidth={DAY_WIDTH}
                      onDragEnd={handleDragEnd}
                      onResizeEnd={handleResizeEnd}
                    />
                  ) : (
                    <div className="ml-4 text-xs text-zinc-600 italic">
                      No dates set
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {editingSection && (
        <EditSectionDialog
          isOpen={!!editingSection}
          onOpenChange={(open) => !open && setEditingSection(null)}
          section={editingSection}
          onConfirm={async (data) =>
            updateSection({ id: editingSection.id, ...data })
          }
        />
      )}
    </div>
  );
}
