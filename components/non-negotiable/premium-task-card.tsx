"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, Flame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NonNegotiable } from "@/app/non-negotiables/page";

interface PremiumTaskCardProps {
  item: NonNegotiable;
  isCompleted: boolean;
  onToggle: () => void;
  onDelete: () => void;
  streak?: number; // Future proofing
  isToggling?: boolean;
}

export function PremiumTaskCard({
  item,
  isCompleted,
  onToggle,
  onDelete,
  isToggling,
}: PremiumTaskCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
          isCompleted
            ? "bg-emerald-950/10 border-emerald-500/20 shadow-[0_0_20px_-10px_rgba(16,185,129,0.5)]"
            : "bg-zinc-900/40 border-white/5 hover:border-white/10"
        )}
      >
        <div className="flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-4 flex-1">
            {isToggling ? (
              <Loader2 className="size-12 animate-spin text-emerald-500" />
            ) : (
              <button
                onClick={() => {
                  if (!isCompleted) {
                    onToggle();
                  }
                }}
                className={cn(
                  "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                    : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 text-transparent cursor-pointer"
                )}
              >
                <AnimatePresence>
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="h-6 w-6" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            )}
            <div className="flex flex-col gap-1">
              <h3
                className={cn(
                  "font-medium text-lg transition-all duration-300",
                  isCompleted ? "text-zinc-500 line-through" : "text-zinc-100"
                )}
              >
                {item.title}
              </h3>
              {isCompleted && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-emerald-500 font-medium flex items-center gap-1"
                >
                  <Flame className="size-3 fill-emerald-500" />
                  Completed
                </motion.span>
              )}
            </div>
          </div>

          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 transition-all duration-200"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {/* Background Glow Effect on Completion */}
        {isCompleted && (
          <motion.div
            layoutId={`glow-${item.id}`}
            className="absolute inset-0 bg-linear-to-r from-emerald-500/5 via-transparent to-transparent pointer-events-none"
          />
        )}
      </div>
    </motion.div>
  );
}
