"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  Clock,
  TrendingUp,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import { TRIGGERS, SEVERITY_LEVELS } from "@/lib/recovery-actions";
import { useState } from "react";

interface RecoverySession {
  id: string;
  triggerType: string;
  severity: number;
  actionAssigned: string;
  status: string;
  completedAt: string | null;
  createdAt: string;
}

export function RecoveryHistory() {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: sessions = [], isLoading } = useQuery<RecoverySession[]>({
    queryKey: ["recovery-sessions"],
    queryFn: async () => {
      const res = await axios.get("/api/recovery");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="mt-12 space-y-4">
        <div className="h-8 w-48 bg-zinc-800/50 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-zinc-900/50 border border-white/5 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) return null;

  const completedCount = sessions.filter(
    (s) => s.status === "COMPLETED",
  ).length;
  const completionRate =
    sessions.length > 0
      ? Math.round((completedCount / sessions.length) * 100)
      : 0;

  // Most common trigger
  const triggerCounts = sessions.reduce(
    (acc, s) => {
      acc[s.triggerType] = (acc[s.triggerType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const mostCommonTriggerKey = Object.entries(triggerCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];
  const mostCommonTrigger = TRIGGERS.find(
    (t) => t.key === mostCommonTriggerKey,
  );

  const displayedSessions = isExpanded ? sessions : sessions.slice(0, 5);

  return (
    <div className="mt-16">
      <div className="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-10" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-white/3 border border-white/7"
        >
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <TrendingUp className="size-4" />
            <span className="text-[11px] font-mono uppercase tracking-wider">
              Total Recoveries
            </span>
          </div>
          <span className="text-2xl font-bold text-white font-mono">
            {sessions.length}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-white/3 border border-white/7"
        >
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Target className="size-4" />
            <span className="text-[11px] font-mono uppercase tracking-wider">
              Completion Rate
            </span>
          </div>
          <span className="text-2xl font-bold text-emerald-400 font-mono">
            {completionRate}%
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-white/3 border border-white/7"
        >
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <BarChart3 className="size-4" />
            <span className="text-[11px] font-mono uppercase tracking-wider">
              Top Trigger
            </span>
          </div>
          <span className="text-lg font-semibold text-zinc-200">
            {mostCommonTrigger?.label || "—"}
          </span>
        </motion.div>
      </div>

      {/* History Header */}
      <div className="flex items-center gap-3 mb-6">
        <History className="size-4 text-zinc-500" />
        <h2 className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-500">
          Recovery Log
        </h2>
      </div>

      {/* Session List */}
      <div className="space-y-3">
        {displayedSessions.map((session, idx) => {
          const trigger = TRIGGERS.find((t) => t.key === session.triggerType);
          const severity = SEVERITY_LEVELS.find(
            (l) => l.level === session.severity,
          );
          const isCompleted = session.status === "COMPLETED";

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-5 rounded-xl border transition-all ${
                isCompleted
                  ? "bg-emerald-500/3 border-emerald-500/10"
                  : "bg-white/2 border-white/6"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {/* Status */}
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                        isCompleted
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="size-3" />
                      ) : (
                        <Clock className="size-3" />
                      )}
                      {session.status}
                    </span>

                    {/* Trigger */}
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-mono text-zinc-400 tracking-wider">
                      {trigger?.label}
                    </span>

                    {/* Severity */}
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-mono text-zinc-400 tracking-wider">
                      {severity?.label}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-300 line-clamp-2">
                    {session.actionAssigned}
                  </p>
                </div>

                <span className="text-[11px] text-zinc-600 font-mono whitespace-nowrap shrink-0 mt-0.5">
                  {formatDistanceToNow(new Date(session.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Show More / Less */}
      {sessions.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-2 px-4 py-2 mx-auto rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-sm hover:bg-white/10 transition-all cursor-pointer"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="size-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="size-4" />
              Show All ({sessions.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}
