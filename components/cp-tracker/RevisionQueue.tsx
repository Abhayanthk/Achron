"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RevisionItem {
  id: string;
  problem_name: string;
  last_revised_date?: string | Date | null;
  platform: string;
}

interface RevisionQueueProps {
  items: RevisionItem[];
}

export function RevisionQueue({ items }: RevisionQueueProps) {
  if (items.length === 0) {
    return (
      <div className="h-full min-h-[200px] w-full bg-zinc-900/50 rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
          <Clock className="h-6 w-6 text-emerald-500" />
        </div>
        <h3 className="text-zinc-200 font-medium mb-1"> all caught up!</h3>
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
        {items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-white/5 hover:border-white/10 transition-colors group"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-zinc-200 text-sm font-medium truncate max-w-[180px]">
                {item.problem_name}
              </span>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="px-1.5 py-0.5 rounded bg-zinc-800/50 border border-white/5">
                  {item.platform}
                </span>
                <span>
                  Last:{" "}
                  {item.last_revised_date
                    ? formatDistanceToNow(new Date(item.last_revised_date), {
                        addSuffix: true,
                      })
                    : "Never"}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ))}
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
