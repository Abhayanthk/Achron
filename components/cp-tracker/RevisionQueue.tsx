"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  REV_LEVEL_LABELS,
  REV_LEVEL_DESCRIPTIONS,
  getDaysOverdue,
} from "@/lib/revision";

interface RevisionItem {
  id: string;
  problem_name: string;
  last_revised_date?: string | Date | null;
  created_at: string | Date;
  platform: string;
  rev_level: number;
  problem_link?: string;
}

interface RevisionQueueProps {
  items: RevisionItem[];
}

const revLevelColors: Record<number, string> = {
  0: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  1: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  2: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  3: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  4: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  5: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
};

export function RevisionQueue({ items }: RevisionQueueProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Sort by most overdue first
  const sortedItems = [...items].sort((a, b) => {
    const overdueA = getDaysOverdue(
      a.last_revised_date || null,
      a.rev_level,
      a.created_at,
    );
    const overdueB = getDaysOverdue(
      b.last_revised_date || null,
      b.rev_level,
      b.created_at,
    );
    return overdueB - overdueA;
  });

  const handleCompleteRevision = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/cp-tracker/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_revision" }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to complete revision:", error);
    } finally {
      setLoadingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="h-full min-h-[200px] w-full bg-zinc-900/50 rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
          <Clock className="h-6 w-6 text-emerald-500" />
        </div>
        <h3 className="text-zinc-200 font-medium mb-1">All caught up!</h3>
        <p className="text-zinc-500 text-sm">No problems pending revision.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-900/50 rounded-xl border border-white/5 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <h3 className="text-zinc-200 font-medium">Revision Queue</h3>
        </div>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
          {items.length} Pending
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {sortedItems.slice(0, 5).map((item) => {
          const overdue = getDaysOverdue(
            item.last_revised_date || null,
            item.rev_level,
            item.created_at,
          );
          const isLoading = loadingId === item.id;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-white/5 hover:border-white/10 transition-colors group"
            >
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="text-zinc-200 text-sm font-medium truncate max-w-[200px]">
                  {item.problem_name}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Platform badge */}
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800/50 border border-white/5 text-zinc-500">
                    {item.platform}
                  </span>
                  {/* Rev level badge */}
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] border font-medium",
                      revLevelColors[item.rev_level] || revLevelColors[0],
                    )}
                    title={REV_LEVEL_DESCRIPTIONS[item.rev_level]}
                  >
                    Lv {item.rev_level} — {REV_LEVEL_LABELS[item.rev_level]}
                  </span>
                  {/* Overdue indicator */}
                  {overdue > 0 && (
                    <span className="text-[10px] text-red-400/80">
                      {overdue}d overdue
                    </span>
                  )}
                  {/* Last revised */}
                  <span className="text-[10px] text-zinc-600">
                    Last:{" "}
                    {item.last_revised_date
                      ? formatDistanceToNow(new Date(item.last_revised_date), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => handleCompleteRevision(item.id)}
                  className={cn(
                    "h-7 px-2 text-[11px] gap-1 transition-all",
                    "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10",
                    "opacity-0 group-hover:opacity-100",
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  Revised
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    window.open(`/cp-tracker/log/${item.id}`, "_blank")
                  }
                  className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
        {items.length > 5 && (
          <div className="text-center pt-2">
            <Button variant="link" className="text-xs text-zinc-500">
              View {items.length - 5} more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
