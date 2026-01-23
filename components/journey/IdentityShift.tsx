"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, User, ArrowRight } from "lucide-react";

interface IdentityAnalysis {
  drift_detected: boolean;
  current_identity: [string, number] | null;
  baseline_identity: [string, number] | null;
  recent_distribution: Record<string, number>;
  baseline_distribution: Record<string, number>;
}

export function IdentityShift({ analysis }: { analysis: IdentityAnalysis }) {
  const currentTop = analysis.current_identity
    ? analysis.current_identity[0]
    : "Unknown";
  const baselineTop = analysis.baseline_identity
    ? analysis.baseline_identity[0]
    : "Unknown";

  const isShift = currentTop !== baselineTop;

  // Process top 3 categories change
  const allCats = Array.from(
    new Set([
      ...Object.keys(analysis.recent_distribution),
      ...Object.keys(analysis.baseline_distribution),
    ]),
  );

  // Calculate relative change
  const changes = allCats
    .map((cat) => {
      const recent = analysis.recent_distribution[cat] || 0;
      const baseline = analysis.baseline_distribution[cat] || 0;
      return { cat, recent, baseline, diff: recent - baseline };
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 backdrop-blur-md h-full flex flex-col"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            Identity Shift
            {isShift && (
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
                Drift Detected
              </span>
            )}
          </h3>
          <p className="text-zinc-400 text-sm">
            Comparison of your dominant focus: Last 30d vs Last 7d.
          </p>
        </div>
        <User className="text-zinc-500 w-5 h-5" />
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-6">
        {/* Primary Shift Visual */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 border border-white/5">
          <div className="text-center w-1/3">
            <div className="text-xs text-zinc-500 mb-1">
              Baseline Identity (30d)
            </div>
            <div className="text-lg font-bold text-zinc-300">{baselineTop}</div>
          </div>

          <ArrowRight
            className={`w-6 h-6 ${isShift ? "text-purple-500" : "text-zinc-600"}`}
          />

          <div className="text-center w-1/3">
            <div className="text-xs text-zinc-500 mb-1">
              Current Identity (7d)
            </div>
            <div
              className={`text-lg font-bold ${isShift ? "text-purple-400" : "text-zinc-300"}`}
            >
              {currentTop}
            </div>
          </div>
        </div>

        {/* Top Changes List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Top Shifts
          </div>
          {changes.map((item) => (
            <div
              key={item.cat}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-zinc-300">{item.cat}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                  {/* Diverging bar logic simplified: visual representation of shift */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((Math.abs(item.diff) / 100) * 100, 100)}%`,
                    }}
                    className={`h-full ${item.diff > 0 ? "bg-emerald-500" : "bg-red-500"}`}
                  />
                </div>
                <span
                  className={`w-8 text-right font-mono ${item.diff > 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {item.diff > 0 ? "+" : ""}
                  {item.diff}
                </span>
              </div>
            </div>
          ))}
          {changes.length === 0 && (
            <div className="text-zinc-500 text-sm">
              No significant data changes yet.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
