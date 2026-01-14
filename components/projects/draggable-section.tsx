"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  title: string;
  color?: string | null;
}

export function DraggableSection({
  section,
  projectColor,
  isCompleted,
  pos,
  dayWidth,
  onDragEnd,
  onResizeEnd,
}: {
  section: Section;
  projectColor: string;
  isCompleted: boolean;
  pos: { left: number; width: number };
  dayWidth: number;
  onDragEnd: (id: string, info: any) => void;
  onResizeEnd: (id: string, info: any) => void;
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const [resizeOffset, setResizeOffset] = useState(0);

  // Track active states
  const isDragging = useRef(false);
  const isResizing = useRef(false);

  // Track start coordinates
  const startX = useRef(0);

  // Reset offsets when the committed position/width updates
  useEffect(() => {
    if (!isDragging.current) setDragOffset(0);
  }, [pos.left]);

  useEffect(() => {
    if (!isResizing.current) setResizeOffset(0);
  }, [pos.width]);

  const handleDragStart = (e: React.PointerEvent) => {
    if (isCompleted || isResizing.current) return;
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const diff = e.clientX - startX.current;
    setDragOffset(diff);
  };

  const handleDragStop = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // Commit drag
    if (dragOffset !== 0) {
      // Don't reset dragOffset immediately - wait for the commit to come back via props
      onDragEnd(section.id, { offset: { x: dragOffset } });
    }
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    if (isCompleted) return;
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    startX.current = e.clientX;
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!isResizing.current) return;
    e.preventDefault();
    e.stopPropagation();
    const diff = e.clientX - startX.current;
    // Visual update only, constrained by minimum width
    if (pos.width + diff >= dayWidth) {
      setResizeOffset(diff);
    }
  };

  const handleResizeStop = (e: React.PointerEvent) => {
    if (!isResizing.current) return;
    e.stopPropagation();
    isResizing.current = false;
    // Commit resize
    if (resizeOffset !== 0) {
      // Don't reset resizeOffset immediately - wait for the commit to come back via props
      onResizeEnd(section.id, { offset: { x: resizeOffset } });
    }
  };

  return (
    <motion.div
      // Manual Drag Event Handlers
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragStop}
      onPointerLeave={handleDragStop}
      // Interaction States
      initial={false}
      animate={{
        x: pos.left + dragOffset,
        width: pos.width + resizeOffset,
        opacity: isCompleted ? 0.5 : 1,
        filter: isCompleted ? "grayscale(100%)" : "none",
        zIndex: isDragging.current || isResizing.current ? 50 : 1,
      }}
      transition={{
        duration: 0.08,
        ease: "linear",
      }}
      className={cn(
        "absolute top-0 h-8 rounded-md backdrop-blur-md border border-white/10 shadow-lg flex items-center px-1 overflow-visible transition-colors select-none touch-none",
        isCompleted
          ? "cursor-default border-dashed"
          : "cursor-grab active:cursor-grabbing hover:border-white/30"
      )}
      style={{
        backgroundColor: `${section.color || projectColor}20`,
        borderColor: `${section.color || projectColor}40`,
      }}
    >
      <span className="text-[10px] font-medium text-white/90 truncate select-none pointer-events-none px-2 flex-1">
        {section.title}
      </span>

      {!isCompleted && (
        <div
          className="absolute right-0 top-0 bottom-0 w-8 cursor-e-resize flex items-center justify-center group/resize z-20"
          // Manual Resize Event Handlers
          onPointerDown={handleResizeStart}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeStop}
          onPointerLeave={handleResizeStop}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Visual Handle - Larger hit area implemented by parent w-8 */}
          <div className="w-8 h-4 bg-white/20 rounded-full group-hover/resize:bg-white/50 transition-colors pointer-events-none" />
        </div>
      )}
    </motion.div>
  );
}
