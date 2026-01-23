"use client";

import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
} from "lucide-react";
import { motion } from "framer-motion";

interface BurnoutAnalysis {
  is_burnout_risk: boolean;
  risk_score: number;
  slopes: {
    focus: number;
    xp: number;
    planning: number;
  };
  reasons: string[];
}

export function BurnoutIndicator({ analysis }: { analysis: BurnoutAnalysis }) {
  const riskLevel =
    analysis.risk_score >= 2
      ? "High"
      : analysis.risk_score >= 1
        ? "Medium"
        : "Low";
  const color =
    analysis.risk_score >= 2
      ? "text-red-500"
      : analysis.risk_score >= 1
        ? "text-amber-500"
        : "text-emerald-500";
  const bgColor =
    analysis.risk_score >= 2
      ? "bg-red-500/10"
      : analysis.risk_score >= 1
        ? "bg-amber-500/10"
        : "bg-emerald-500/10";
  const borderColor =
    analysis.risk_score >= 2
      ? "border-red-500/20"
      : analysis.risk_score >= 1
        ? "border-amber-500/20"
        : "border-emerald-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${borderColor} ${bgColor} p-6 backdrop-blur-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3
            className={`text-lg font-semibold ${color} flex items-center gap-2`}
          >
            {analysis.risk_score >= 2 && <AlertTriangle className="h-5 w-5" />}
            Burnout Risk: {riskLevel}
          </h3>
          <p className="text-zinc-400 text-sm mt-1">
            Early detection based on 14-day trend analysis.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {analysis.risk_score}/3
          </div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">
            Risk Score
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {analysis.reasons.length > 0 ? (
          analysis.reasons.map((reason, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-sm text-zinc-300"
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${color.replace("text", "bg")}`}
              />
              {reason}
            </div>
          ))
        ) : (
          <div className="flex items-center gap-3 text-sm text-emerald-400">
            <BrainCircuit className="h-4 w-4" />
            No psychological risk factors detected.
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className="text-xs text-zinc-500 mb-1">Focus</div>
          <div
            className={`flex items-center justify-center gap-1 font-mono text-sm ${analysis.slopes.focus < 0 ? "text-red-400" : "text-emerald-400"}`}
          >
            {analysis.slopes.focus < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            {Math.abs(analysis.slopes.focus)}
          </div>
        </div>
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className="text-xs text-zinc-500 mb-1">Output (XP)</div>
          <div
            className={`flex items-center justify-center gap-1 font-mono text-sm ${analysis.slopes.xp < 0 ? "text-red-400" : "text-emerald-400"}`}
          >
            {analysis.slopes.xp < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            {Math.abs(analysis.slopes.xp)}
          </div>
        </div>
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className="text-xs text-zinc-500 mb-1">Planning</div>
          <div
            className={`flex items-center justify-center gap-1 font-mono text-sm ${analysis.slopes.planning > 0 ? "text-amber-400" : "text-zinc-400"}`}
          >
            {analysis.slopes.planning > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(analysis.slopes.planning)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
