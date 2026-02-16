"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CodeEditor } from "./CodeEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Clock,
  ExternalLink,
  Target,
  Zap,
  AlertTriangle,
  ChevronLeft,
  Save,
  Share2,
  Calendar,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";

interface LogDetailsProps {
  log: any; // Using any for flexibility with Prisma payload, but ideally typed
}

export function LogDetails({ log }: LogDetailsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Form for the "Deep Learning" section + Code Editor (Read Only)
  const form = useForm({
    defaultValues: {
      code_snippets: log.code_snippets || [
        { name: "Main", language: "cpp", code: "", tries: 1 },
      ],
      pattern_generalization_note: log.pattern_generalization_note || "",
      key_learning_points: log.key_learning_points || [], // Should be mapped if it's an array of objects
    },
  });

  const onSubmitDeepLearning = async (data: any) => {
    setIsSaving(true);
    try {
      // Optimistic update or simple API call
      await axios.patch(`/api/cp-tracker/${log.id}`, {
        pattern_generalization_note: data.pattern_generalization_note,
        code_snippets: data.code_snippets, // Save code changes too
        // map Update logic for key_learning_points if needed
      });
      toast.success("Changes saved successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const isSolvedClean = log.solve_status_type === "Solved Clean";

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-10 font-sans">
      {/* Header / Nav */}
      <div className="max-w-[1920px] mx-auto mb-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-white pl-0 hover:bg-transparent"
        >
          <ChevronLeft className="h-5 w-5 mr-2" /> Back to Library
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300"
          >
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        {/* --- LEFT COLUMN: Sticky Code Editor --- */}
        <div className="lg:col-span-6 lg:h-[calc(100vh-120px)] lg:sticky lg:top-8 flex flex-col">
          <div className="flex-1 shadow-2xl rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
            <CodeEditor
              control={form.control}
              register={form.register}
              watch={form.watch}
              disabled={false} // Editable Mode
            />
          </div>
        </div>

        {/* --- RIGHT COLUMN: Details & Analysis --- */}
        <div className="lg:col-span-6 space-y-10 pb-20">
          {/* 1. Header & Identity */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                  {log.problem_name}
                </h1>
                <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                    <Trophy className="h-3.5 w-3.5" /> {log.platform}{" "}
                    {log.contest_id}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                    <Calendar className="h-3.5 w-3.5" />{" "}
                    {format(new Date(log.created_at), "MMM d, yyyy")}
                  </span>
                  {log.rating && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                      <Zap className="h-3.5 w-3.5" /> Rating: {log.rating}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={log.problem_link}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
              >
                <ExternalLink className="h-6 w-6" />
              </a>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {/* Pattern Badge */}
              {log.pattern && (
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30 px-3 py-1.5 text-sm">
                  <Target className="h-3.5 w-3.5 mr-2" />
                  {log.pattern.name}{" "}
                  {log.pattern_subtype ? `— ${log.pattern_subtype}` : ""}
                </Badge>
              )}
              {/* Tags */}
              {log.tags &&
                log.tags.map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-white/10 text-zinc-400"
                  >
                    #{tag}
                  </Badge>
                ))}
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* 2. Key Metrics Grid */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-zinc-400" /> Performance Metrics
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl">
                <div className="text-zinc-500 text-xs mb-1">Idea Time</div>
                <div className="text-2xl font-mono text-white">
                  {log.time_to_first_idea_minutes}m
                </div>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl">
                <div className="text-zinc-500 text-xs mb-1">Impl Time</div>
                <div className="text-2xl font-mono text-white">
                  {log.implementation_time_minutes}m
                </div>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl">
                <div className="text-zinc-500 text-xs mb-1">Debug Time</div>
                <div className="text-2xl font-mono text-white">
                  {log.debug_time_minutes}m
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stress & Load Visuals could go here (Progress bars or unique visuals) */}
              <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <span className="text-sm text-zinc-400">Stress Level</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 w-2 rounded-full",
                        i < (log.stress_level_during || 0)
                          ? "bg-red-500"
                          : "bg-zinc-800",
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <span className="text-sm text-zinc-400">Difficulty</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 w-4 rounded-sm",
                        i < (log.perceived_difficulty_after || 0)
                          ? "bg-orange-500"
                          : "bg-zinc-800",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3. Failure Analysis (Conditional) */}
          {!isSolvedClean && (
            <section className="bg-red-950/20 border border-red-500/20 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Why it wasn't clean
              </h3>

              <div className="flex flex-wrap gap-2">
                {log.failure_categories?.map((cat: string) => (
                  <Badge
                    key={cat}
                    className="bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                  >
                    {cat}
                  </Badge>
                ))}
              </div>

              {log.mistakes_text && (
                <div className="mt-4 p-4 bg-black/20 rounded-lg border border-red-500/10">
                  <div className="text-xs text-red-400/70 uppercase tracking-wider mb-2 font-semibold">
                    Diagnosis
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-sm whitespace-pre-wrap">
                    {log.mistakes_text}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* 4. Deep Learning (Editable) */}
          <section className="bg-indigo-950/10 border border-indigo-500/20 p-6 rounded-2xl relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                Editable
              </Badge>
            </div>

            <h3 className="text-lg font-semibold text-indigo-300 mb-6 flex items-center gap-2">
              <Brain className="h-5 w-5" /> Deep Learning & Pattern Recognition
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-indigo-200/70 text-sm">
                  Generalization Note
                </Label>
                <Textarea
                  {...form.register("pattern_generalization_note")}
                  className="bg-black/40 border-indigo-500/20 text-indigo-100 focus:border-indigo-500 transition-colors min-h-[120px] resize-y"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={form.handleSubmit(onSubmitDeepLearning)}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                >
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
