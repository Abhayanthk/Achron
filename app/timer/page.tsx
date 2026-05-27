"use client";
import {
  useTimer,
  SessionType,
  AlarmSoundType,
} from "@/components/providers/timer-context";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Clock,
  Zap,
  Target,
  PictureInPicture2,
  X,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { usePipWindow } from "@/hooks/usePipWindow";
import { PipPortal } from "@/components/timer/PipPortal";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import SetAlarmDialog from "@/components/tasks/set-alarm-dialog";
import SegmentedControlButton from "@/components/analytics/segmentedControlButton";
import CreateTimerDialog from "@/components/tasks/create-timer-dialog";
import EditTimerDialog from "@/components/tasks/edit-timer-dialog";
import ResetTimerDialog from "@/components/tasks/reset-timer-dialog";
import DateNavButtons from "@/components/analytics/dateNavButtons";
import { useDateNavigator } from "@/hooks/useDateNavigation";
import { TimerPreset } from "@/components/providers/timer-context";

export default function TimerPage() {
  const {
    isActive,
    timeLeft,
    reset,
    formatTime,
    setSession,
    presets,
    addPreset,
    updatePreset,
    deletePreset,
    isLoadingPresets,
    alarmSound,
    setAlarmSound,
    playPreview,
  } = useTimer();
  const [viewMode, setViewMode] = useState<"timer" | "stats">("timer");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  const [unit, setUnit] = useState<"hrs" | "mins">("hrs");
  const { date, goPrev, goNext, goToday } = useDateNavigator(timeRange);

  const { pipWindow, openPip, closePip, isSupported } = usePipWindow();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<{
    duration: number;
    type: string;
    name: string;
    id: string;
  } | null>(null);

  const [editingPreset, setEditingPreset] = useState<TimerPreset | null>(null);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);

  const handleDeletePreset = async (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    setDeletingPresetId(presetId);
    try {
      await deletePreset(presetId);
      toast.success("Timer deleted");
    } catch {
      toast.error("Failed to delete timer");
    } finally {
      setDeletingPresetId(null);
    }
  };

  // Fetch Analytics Data
  const { data: analyticsData = [], isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["analytics", "timer", timeRange, date],
    queryFn: async () => {
      const res = await axios.get(
        `/api/analytics?range=${timeRange}&type=timer&startDate=${date}`,
      );
      return res.data.data;
    },
  });
  // Data Normalization Helper
  const fillData = (data: any[], range: string) => {
    if (range === "week") {
      // Current week days
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return days.map((day) => {
        const found = data.find((d) => d.name === day);
        return { name: day, hours: found ? found.hours : 0 };
      });
    }
    if (range === "year") {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return months.map((month) => {
        const found = data.find((d) => d.name === month);
        return { name: month, hours: found ? found.hours : 0 };
      });
    }
    if (range === "month") {
      // selects all weeks from the current month
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
      // Check if data names match "Week X".
      const hasWeeks = data.some((d) => d.name.startsWith("Week"));
      if (hasWeeks) {
        return weeks.map((week) => {
          const found = data.find((d) => d.name === week);
          return { name: week, hours: found ? found.hours : 0 };
        });
      }
      // If not weeks (e.g. days), just return data or fill 1-31?
      return data;
    }
    return data;
  };

  const rawData = useMemo(() => fillData(analyticsData, timeRange), [analyticsData, timeRange]);
  const currentData = useMemo(() => rawData.map((d: any) => ({
    ...d,
    value: unit === "mins" ? Number((d.hours * 60).toFixed(0)) : d.hours,
  })), [rawData, unit]);

  // Calculate Stats
  const totalHours = useMemo(() => currentData.reduce(
    (acc: number, curr: any) => acc + curr.hours,
    0,
  ), [currentData]);

  return (
    <div className="flex flex-col h-full bg-black min-h-screen text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_50%)]" />
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            isActive ? "opacity-30" : "opacity-0",
          )}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between mb-12">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="size-5" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-full border border-white/5">
          <button
            onClick={() => setViewMode("timer")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
              viewMode === "timer"
                ? "bg-white text-black shadow-lg"
                : "text-zinc-400 hover:text-white",
            )}
          >
            Timer
          </button>
          <button
            onClick={() => setViewMode("stats")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
              viewMode === "stats"
                ? "bg-white text-black shadow-lg"
                : "text-zinc-400 hover:text-white",
            )}
          >
            Analytics
          </button>
        </div>

        {/* Start of Alarm Settings Dialog */}
        <SetAlarmDialog
          playPreview={playPreview}
          alarmSound={alarmSound}
          setAlarmSound={setAlarmSound}
        />
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {viewMode === "timer" ? (
            <motion.div
              key="timer-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center"
            >
              {pipWindow ? (
                <div className="flex flex-col items-center gap-4 mb-16">
                  <div className="text-4xl font-mono font-bold tabular-nums text-zinc-600">
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-sm text-zinc-500">
                    Timer is in pop-out window
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-800 bg-black/50 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white"
                    onClick={closePip}
                  >
                    <X className="size-4 mr-2" />
                    Close pop-out
                  </Button>
                </div>
              ) : (
                <TimerDisplay
                  actions={
                    isSupported ? (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-full border-zinc-800 bg-black/50 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-500 hover:text-white transition-all"
                        onClick={openPip}
                        title="Pop out timer"
                      >
                        <PictureInPicture2 className="size-5" />
                      </Button>
                    ) : undefined
                  }
                />
              )}

              {/* Presets Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {isLoadingPresets
                  ? Array(4)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-start p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 h-[88px] relative"
                        >
                          <Skeleton className="h-4 w-24 mb-2 bg-zinc-800" />
                          <Skeleton className="h-3 w-12 bg-zinc-800" />
                          <Skeleton className="absolute top-4 right-4 h-2 w-2 rounded-full bg-zinc-800" />
                        </div>
                      ))
                  : presets.map((preset) => {
                      const isDefault = preset.id === "1";
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            if (isActive) {
                              setPendingPreset({
                                duration: preset.duration,
                                type: preset.type,
                                name: preset.name,
                                id: preset.id,
                              });
                              setShowResetConfirm(true);
                            } else {
                              setSession(
                                preset.duration,
                                preset.type as SessionType,
                                preset.name,
                                preset.id,
                              );
                            }
                          }}
                          className="group relative flex flex-col items-start p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all text-left"
                        >
                          {/* Color dot + hover actions */}
                          <div className="absolute top-3 right-3 flex items-center gap-1">
                            {!isDefault && (
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span
                                  role="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPreset(preset);
                                  }}
                                  className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                  <Pencil className="h-3 w-3" />
                                </span>
                                <span
                                  role="button"
                                  onClick={(e) => handleDeletePreset(e, preset.id)}
                                  className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  {deletingPresetId === preset.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </span>
                              </div>
                            )}
                            <div
                              className={`h-2 w-2 rounded-full ${preset.color} opacity-50 group-hover:opacity-100 transition-opacity`}
                            />
                          </div>
                          <span className="text-sm font-bold text-zinc-300 group-hover:text-white mb-1 pr-12">
                            {preset.name}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">
                            {Math.floor(preset.duration / 60)}m
                          </span>
                        </button>
                      );
                    })}

                <CreateTimerDialog addPreset={addPreset} />

                {editingPreset && (
                  <EditTimerDialog
                    preset={editingPreset}
                    open={!!editingPreset}
                    onOpenChange={(open) => {
                      if (!open) setEditingPreset(null);
                    }}
                    onSave={updatePreset}
                  />
                )}

                <ResetTimerDialog
                  open={showResetConfirm}
                  onOpenChange={setShowResetConfirm}
                  onConfirm={() => {
                    if (pendingPreset) {
                      setSession(
                        pendingPreset.duration,
                        pendingPreset.type as SessionType,
                        pendingPreset.name,
                        pendingPreset.id,
                      );
                      reset();
                      setShowResetConfirm(false);
                      setPendingPreset(null);
                    }
                  }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="stats-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                  <div className="flex items-center gap-3 text-zinc-400 mb-2">
                    <Clock className="size-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Total Focus
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {totalHours.toFixed(1)}h
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">This {timeRange}</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                  <div className="flex items-center gap-3 text-zinc-400 mb-2">
                    <Zap className="size-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Current Streak
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">8 Days</p>
                  <p className="text-xs text-zinc-500 mt-1">Keep it up!</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                  <div className="flex items-center gap-3 text-zinc-400 mb-2">
                    <Target className="size-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Daily Goal
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {totalHours.toFixed(1)}/6h
                  </p>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min((totalHours / 6) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[400px] w-full p-6 rounded-2xl bg-zinc-900/30 border border-white/5 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                    Focus Distribution
                  </h3>
                  <div className="flex gap-4">
                    {/* Unit Toggle */}
                    <SegmentedControlButton
                      options={["hrs", "mins"]}
                      value={unit}
                      onChange={setUnit}
                    />

                    {/* Time Range Toggle */}
                    <SegmentedControlButton
                      options={["month", "week", "year"]}
                      value={timeRange}
                      onChange={setTimeRange}
                    />
                  </div>
                </div>
                <DateNavButtons
                  handleDateChangeLeft={goPrev}
                  handleDateChangeRight={goNext}
                  handleToday={goToday}
                />
                <div className="flex-1 w-full min-h-0">
                  {isLoadingAnalytics ? (
                    <div className="w-full h-full flex items-end justify-between gap-2 p-4 animate-pulse">
                      {Array(7)
                        .fill(0)
                        .map((_, i) => (
                          <div
                            key={i}
                            className="w-full bg-zinc-800 rounded-t-lg"
                            style={{ height: `${20 + Math.random() * 60}%` }}
                          />
                        ))}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={currentData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#27272a"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="#52525b"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          stroke="#52525b"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) =>
                            `${value}${unit === "hrs" ? "h" : "m"}`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #27272a",
                            borderRadius: "8px",
                          }}
                          cursor={{ fill: "#27272a" }}
                        />
                        <Bar
                          name={unit === "hrs" ? "Hrs" : "Mins"}
                          dataKey="value"
                          radius={[4, 4, 0, 0]}
                          fill="#3b82f6"
                          minPointSize={2}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <PipPortal pipWindow={pipWindow}>
        <TimerDisplay compact />
      </PipPortal>
    </div>
  );
}
