"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Battery,
  Magnet,
  GraduationCap,
  EyeOff,
  Brain,
  UserMinus,
  Flame,
  XCircle,
  Users,
  Zap,
  ArrowLeftRight,
  HeartPulse,
  Heart,
} from "lucide-react";
import { TRIGGERS, SEVERITY_LEVELS } from "@/lib/recovery-actions";

type TriggerKey = (typeof TRIGGERS)[number]["key"];

interface RecoverySession {
  id: string;
  triggerType: string;
  severity: number;
  actionAssigned: string;
  status: string;
  completedAt: string | null;
  createdAt: string;
}

const TRIGGER_ICONS: Record<string, React.ElementType> = {
  TIREDNESS: Battery,
  RESISTANCE: Magnet,
  EXAM_PRESSURE: GraduationCap,
  AVOIDANCE: EyeOff,
  BOREDOM: Brain,
  FEELING_INFERIOR: UserMinus,
  ACCIDENTAL_TEMPTATION: Flame,
  EXTERNAL_FAILURE: XCircle,
  SOCIAL_DISCOMFORT: Users,
  OVERSTIMULATION: Zap,
  TRANSITION_MOMENT: ArrowLeftRight,
  PHYSICAL_STATE: HeartPulse,
  LONELINESS: Heart,
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
};

export function RecoveryFlow() {
  const [step, setStep] = useState(0); // 0 = trigger, 1 = severity, 2 = action
  const [direction, setDirection] = useState(1);
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerKey | null>(
    null,
  );
  const [selectedSeverity, setSelectedSeverity] = useState<number | null>(null);
  const [currentSession, setCurrentSession] =
    useState<RecoverySession | null>(null);

  const queryClient = useQueryClient();

  const createSession = useMutation({
    mutationFn: async (data: { triggerType: string; severity: number }) => {
      const res = await axios.post("/api/recovery", data);
      return res.data;
    },
    onSuccess: (data: RecoverySession) => {
      setCurrentSession(data);
      setDirection(1);
      setStep(2);
    },
    onError: () => {
      toast.error("Something went wrong. Try again.");
    },
  });

  const completeSession = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.patch(`/api/recovery/${id}/complete`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("You showed up. +25 XP earned.", {
        description: "Recovery session completed.",
      });
      queryClient.invalidateQueries({ queryKey: ["recovery-sessions"] });
      // Reset flow
      setStep(0);
      setSelectedTrigger(null);
      setSelectedSeverity(null);
      setCurrentSession(null);
    },
    onError: () => {
      toast.error("Couldn't complete session. Try again.");
    },
  });

  function handleTriggerSelect(key: TriggerKey) {
    setSelectedTrigger(key);
    setDirection(1);
    setStep(1);
  }

  function handleSeveritySelect(level: number) {
    setSelectedSeverity(level);
    if (selectedTrigger) {
      createSession.mutate({ triggerType: selectedTrigger, severity: level });
    }
  }

  function handleBack() {
    setDirection(-1);
    if (step === 1) {
      setStep(0);
      setSelectedSeverity(null);
    } else if (step === 2) {
      setStep(1);
      setCurrentSession(null);
    }
  }

  function handleReset() {
    setDirection(-1);
    setStep(0);
    setSelectedTrigger(null);
    setSelectedSeverity(null);
    setCurrentSession(null);
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-3">
          Recovery Protocol V1
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
          Failure Map
        </h1>
        <p className="text-zinc-400 text-sm">
          Identify the trigger. Assess the level. Get back in.
        </p>
      </div>

      {/* Progress Indicators */}
      <div className="flex items-center gap-2 mb-8">
        {["Trigger", "Severity", "Action"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= step
                  ? "bg-emerald-500 w-16 md:w-24"
                  : "bg-zinc-800 w-8 md:w-12"
              }`}
            />
            <span
              className={`text-[10px] font-mono uppercase tracking-wider transition-colors ${
                i <= step ? "text-emerald-400" : "text-zinc-600"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Flow Content */}
      <div className="relative min-h-[420px]">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <StepTrigger
                selectedTrigger={selectedTrigger}
                onSelect={handleTriggerSelect}
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <StepSeverity
                selectedSeverity={selectedSeverity}
                onSelect={handleSeveritySelect}
                onBack={handleBack}
                isLoading={createSession.isPending}
              />
            </motion.div>
          )}

          {step === 2 && currentSession && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <StepAction
                session={currentSession}
                onComplete={() => completeSession.mutate(currentSession.id)}
                onReset={handleReset}
                isCompleting={completeSession.isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Step 1: Trigger Selection ──────────────────────────────────────────────
function StepTrigger({
  selectedTrigger,
  onSelect,
}: {
  selectedTrigger: TriggerKey | null;
  onSelect: (key: TriggerKey) => void;
}) {
  return (
    <div>
      <h2 className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-5">
        01 — What Triggered It
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {TRIGGERS.map((trigger) => {
          const Icon = TRIGGER_ICONS[trigger.key] || Brain;
          const isSelected = selectedTrigger === trigger.key;

          return (
            <motion.button
              key={trigger.key}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(trigger.key as TriggerKey)}
              className={`relative p-4 rounded-xl border text-left transition-all duration-300 cursor-pointer group ${
                isSelected
                  ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                  : "bg-white/3 border-white/7 hover:bg-white/6 hover:border-white/15"
              } lowercase transition-all duration-300 cursor-pointer group`}
            >
              <Icon
                className={`size-4 mb-3 transition-colors ${
                  isSelected
                    ? "text-emerald-400"
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              <div
                className={`text-sm font-semibold mb-1 transition-colors ${
                  isSelected ? "text-emerald-300" : "text-zinc-200"
                }`}
              >
                {trigger.label}
              </div>
              <div className="text-[11px] text-zinc-500 leading-snug">
                {trigger.description}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Severity Assessment ────────────────────────────────────────────
function StepSeverity({
  selectedSeverity,
  onSelect,
  onBack,
  isLoading,
}: {
  selectedSeverity: number | null;
  onSelect: (level: number) => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4 text-zinc-400" />
        </button>
        <h2 className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-500">
          02 — How Far In Are You
        </h2>
      </div>

      <div className="space-y-8">
        {/* Level Buttons */}
        <div className="flex flex-wrap gap-3">
          {SEVERITY_LEVELS.map((level) => {
            const isSelected = selectedSeverity === level.level;
            return (
              <motion.button
                key={level.level}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(level.level)}
                disabled={isLoading}
                className={`relative px-5 py-3 rounded-xl border font-mono text-sm font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50 ${
                isSelected
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "bg-white/3 border-white/7 text-zinc-300 hover:bg-white/7 hover:border-white/15"
                }`}
              >
                {isLoading && isSelected ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="size-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full"
                  />
                ) : (
                  level.label
                )}
              </motion.button>
            );
          })}
          <span className="flex items-center text-[11px] text-zinc-600 font-mono">
            select a level
          </span>
        </div>

        {/* Gradient Scale */}
        <div className="space-y-2">
          <div className="h-1 rounded-full bg-linear-to-r from-emerald-500/50 via-amber-500/50 to-red-500/50" />
          <div className="flex justify-between">
            <span className="text-[11px] font-mono text-zinc-500">
              Slip — 60 min
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              Drift — 1 month
            </span>
          </div>
        </div>

        {/* Level Description */}
        <AnimatePresence mode="wait">
          {selectedSeverity && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-white/3 border border-white/7"
            >
              {(() => {
                const level = SEVERITY_LEVELS.find(
                  (l) => l.level === selectedSeverity,
                );
                return level ? (
                  <div>
                    <span className="text-sm font-semibold text-white">
                      {level.name}
                    </span>
                    <span className="text-zinc-500 text-sm ml-2">
                      ({level.timeframe})
                    </span>
                  </div>
                ) : null;
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Step 3: The Action ─────────────────────────────────────────────────────
function StepAction({
  session,
  onComplete,
  onReset,
  isCompleting,
}: {
  session: RecoverySession;
  onComplete: () => void;
  onReset: () => void;
  isCompleting: boolean;
}) {
  const isCompleted = session.status === "COMPLETED";
  const trigger = TRIGGERS.find((t) => t.key === session.triggerType);
  const severity = SEVERITY_LEVELS.find((l) => l.level === session.severity);

  return (
    <div>
      <h2 className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-5">
        03 — Your Action
      </h2>

      {/* Context Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/8 text-[11px] font-mono text-zinc-400">
          {trigger?.label}
        </span>
        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/8 text-[11px] font-mono text-zinc-400">
          {severity?.label} — {severity?.name}
        </span>
      </div>

      {/* Action Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="relative p-8 rounded-2xl bg-linear-to-br from-white/4 to-white/1 border border-white/8 backdrop-blur-sm"
      >
        {/* Breathing border animation */}
        <div className="absolute inset-0 rounded-2xl border border-emerald-500/20 animate-pulse pointer-events-none" />

        <Sparkles className="size-5 text-emerald-400/60 mb-5" />

        <p className="text-lg md:text-xl text-zinc-100 leading-relaxed font-medium">
          {session.actionAssigned}
        </p>

        <p className="text-xs text-zinc-600 mt-6 italic">
          No pressure. Just this one thing.
        </p>
      </motion.div>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-8">
        {!isCompleted && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onComplete}
            disabled={isCompleting}
            className="flex items-center gap-3 px-8 py-4 rounded-xl bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_40px_rgba(16,185,129,0.35)] disabled:opacity-50 cursor-pointer"
          >
            {isCompleting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  ease: "linear",
                }}
                className="size-5 border-2 border-black/30 border-t-black rounded-full"
              />
            ) : (
              <Check className="size-5" strokeWidth={3} />
            )}
            <span>Mark as Completed</span>
          </motion.button>
        )}

        <button
          onClick={onReset}
          className="px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-sm hover:bg-white/10 hover:text-zinc-200 transition-all cursor-pointer"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
