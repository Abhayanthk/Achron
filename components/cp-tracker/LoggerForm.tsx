"use client";

import React, { useState, useEffect } from "react";
// import Editor from "@monaco-editor/react"; // Moved to CodeEditor.tsx
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { CodeEditor } from "./CodeEditor";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Plus,
  Clock,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { CreatableSelect, Option } from "@/components/ui/creatable-select";

// --- Schema ---
const problemLogSchema = z.object({
  problem_name: z.string().min(1, "Problem name is required"),
  problem_link: z.string().url("Must be a valid URL"),
  platform: z.enum(["CF", "AtCoder", "LC", "CodeChef", "Other"]),
  contest_id: z.string().optional(),
  rating: z.coerce.number().min(0, "Rating must be positive").default(0),
  tags: z.array(z.string()).default([]),
  pattern_types: z.array(z.string()).min(1, "At least one pattern is required"),
  pattern_subtype: z.string().optional(),

  code_snippets: z
    .array(
      z.object({
        name: z.string().min(1, "Name required (e.g. Iterative, Recursive)"),
        code: z.string().optional(),
        language: z
          .enum(["cpp", "python", "java", "javascript"])
          .default("cpp"),
        tries: z.coerce.number().min(1).default(1),
      }),
    )
    .default([]),

  solve_status_type: z.enum([
    "Solved Clean",
    "Solved with Hint",
    "Solved after Editorial",
    "Partial",
    "Failed",
  ]),
  idea_source: z
    .enum(["Self", "Small Hint", "Major Hint", "Editorial"])
    .optional(),
  attempt_count: z.coerce.number().min(1).default(1),

  time_to_first_idea_minutes: z.coerce.number().min(0).default(0),
  implementation_time_minutes: z.coerce.number().min(0).default(0),
  debug_time_minutes: z.coerce.number().min(0).default(0),
  total_time_minutes: z.coerce.number().min(0).default(0),

  perceived_difficulty_before: z.coerce.number().min(1).max(5).default(3),
  perceived_difficulty_after: z.coerce.number().min(1).max(5).default(3),
  mental_load_score: z.coerce.number().min(1).max(10).default(5),
  stress_level_during: z.coerce.number().min(1).max(10).default(5),

  failure_categories: z.array(z.string()).default([]),

  mistakes_text: z.string().optional(),
  learning_from_failure: z.string().optional(),
  edge_cases_found: z.string().optional(),
  invariant_or_key_property: z.string().optional(),

  final_verdict: z.enum(["AC", "WA", "TLE", "MLE", "RE"]).optional(),

  core_tricks_used: z.array(z.string()).default([]),
  template_used: z.boolean().default(false),
  template_name: z.string().optional(),

  must_revisit: z.boolean().default(false),

  key_learning_points: z.array(z.string()).default([]),
  pattern_generalization_note: z.string().optional(),
  similar_problems_links: z.array(z.string()).default([]),
});

type ProblemLogFormValues = z.infer<typeof problemLogSchema>;

const FAILURE_OPTIONS = [
  "Misread Problem",
  "Logic Error",
  "Implementation Bug",
  "Edge Case Missed",
  "Overflow/Underflow",
  "Time Limit Exceeded (Optimal Idea)",
  "Time Limit Exceeded (Suboptimal)",
  "Memory Limit Exceeded",
  "Wrong Greedy Choice",
  "Math/Formula Error",
  "Off-by-one",
  "Typo/Syntax",
  "Concept Gap",
];

const PLATFORM_OPTIONS = ["CF", "AtCoder", "LC", "CodeChef", "Other"];
const STATUS_OPTIONS = [
  "Solved Clean",
  "Solved with Hint",
  "Solved after Editorial",
  "Partial",
  "Failed",
];
const IDEA_SOURCE_OPTIONS = ["Self", "Small Hint", "Major Hint", "Editorial"];
const VERDICT_OPTIONS = ["AC", "WA", "TLE", "MLE", "RE"];

// --- Props ---
interface LoggerFormProps {
  mode?: "create" | "view" | "edit";
  initialData?: any; // We can refine this type later based on the Prisma include
}

export function LoggerForm({ mode = "create", initialData }: LoggerFormProps) {
  const router = useRouter();
  const [activeSnippetIndex, setActiveSnippetIndex] = React.useState(0);

  // Metadata State
  const [availableTags, setAvailableTags] = React.useState<Option[]>([]);
  const [availablePatterns, setAvailablePatterns] = React.useState<Option[]>(
    [],
  );
  const [availableKeyLearnings, setAvailableKeyLearnings] = React.useState<
    Option[]
  >([]);

  // Fetch Metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await axios.get("/api/cp-tracker/metadata");
        console.log("Raw Metadata:", res.data); // Debugging

        // Merge all sources into availableTags for the first dropdown
        const databaseTags = res.data.tags || [];
        const databasePatterns = res.data.patterns || [];
        const databaseLearnings = res.data.keyLearnings || [];

        // Debugging logs
        console.log("DB Tags:", databaseTags);
        console.log("DB Patterns:", databasePatterns);

        const mergedTags = [
          ...databaseTags,
          ...databasePatterns,
          ...databaseLearnings,
        ];

        // Deduplicate by value
        const uniqueTags = Array.from(
          new Map(mergedTags.map((item) => [item.value, item])).values(),
        );

        setAvailableTags(uniqueTags);
        setAvailablePatterns(databasePatterns);
        setAvailableKeyLearnings(databaseLearnings);
      } catch (err) {
        console.error("Failed to fetch metadata", err);
      }
    };
    fetchMetadata();
  }, []);

  // Refined Default Values based on initialData
  const defaultValues: Partial<ProblemLogFormValues> = {
    problem_name: initialData?.problem_name || "",
    problem_link: initialData?.problem_link || "",
    platform: (initialData?.platform as any) || undefined,
    contest_id: initialData?.contest_id || "",
    rating: initialData?.rating || 0,
    // Map relations back to form shape
    tags: initialData?.tags?.map((t: any) => t.name) || [],
    pattern_types: initialData?.patterns?.map((p: any) => p.name) || [],
    pattern_subtype: initialData?.pattern_subtype || "",

    code_snippets:
      initialData?.code_snippets?.map((s: any) => ({
        ...s,
        language: s.language || "cpp",
      })) || [],

    solve_status_type: (initialData?.solve_status_type as any) || undefined,
    idea_source: (initialData?.idea_source as any) || undefined,
    attempt_count: initialData?.attempt_count || 1,

    time_to_first_idea_minutes: initialData?.time_to_first_idea_minutes || 0,
    implementation_time_minutes: initialData?.implementation_time_minutes || 0,
    debug_time_minutes: initialData?.debug_time_minutes || 0,
    total_time_minutes: initialData?.total_time_minutes || 0,

    perceived_difficulty_before: initialData?.perceived_difficulty_before || 3,
    perceived_difficulty_after: initialData?.perceived_difficulty_after || 3,
    mental_load_score: initialData?.mental_load_score || 3,
    stress_level_during: initialData?.stress_level_during || 5,

    failure_categories: initialData?.failure_categories || [],

    mistakes_text: initialData?.mistakes_text || "",
    learning_from_failure: initialData?.learning_from_failure || "",
    edge_cases_found: initialData?.edge_cases_found || "",
    invariant_or_key_property: initialData?.invariant_or_key_property || "",

    final_verdict: (initialData?.final_verdict as any) || undefined,

    core_tricks_used: initialData?.core_tricks_used || [],
    template_used: initialData?.template_used || false,
    template_name: initialData?.template_name || "",

    must_revisit: initialData?.must_revisit || false,

    key_learning_points:
      initialData?.key_learning_points?.map((k: any) => k.point) || [],
    pattern_generalization_note: initialData?.pattern_generalization_note || "",
    similar_problems_links: initialData?.similar_problems_links || [],
  };

  const form = useForm<ProblemLogFormValues>({
    resolver: zodResolver(problemLogSchema) as any,
    defaultValues,
  });

  const {
    fields: snippetFields,
    append: appendSnippet,
    remove: removeSnippet,
  } = useFieldArray({
    control: form.control,
    name: "code_snippets",
  });

  const watchedTimeFields = form.watch([
    "time_to_first_idea_minutes",
    "implementation_time_minutes",
    "debug_time_minutes",
  ]);
  const watchedStatus = form.watch("solve_status_type");
  const watchedDifficulty = form.watch("perceived_difficulty_after");

  // Auto-sum time
  const totalTime =
    (Number(watchedTimeFields[0]) || 0) +
    (Number(watchedTimeFields[1]) || 0) +
    (Number(watchedTimeFields[2]) || 0);

  async function onSubmit(data: ProblemLogFormValues) {
    try {
      // Auto-sum time
      const totalTime =
        (Number(watchedTimeFields[0]) || 0) +
        (Number(watchedTimeFields[1]) || 0) +
        (Number(watchedTimeFields[2]) || 0);

      const payload = {
        ...data,
        total_time_minutes: totalTime,
      };

      if (mode === "create") {
        await axios.post("/api/cp-tracker", payload);
        toast.success("Problem logged successfully!");
        router.push("/cp-tracker");
        router.refresh();
      } else {
        // View/Edit mode - Update existing
        if (!initialData?.id) {
          toast.error("Error: No Log ID found");
          return;
        }
        await axios.patch(`/api/cp-tracker/${initialData.id}`, payload);
        toast.success("Log updated successfully!");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to save log");
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* --- LEFT COLUMN: Code Snippets & Strategy (6 cols - 50%) --- */}
          <div className="lg:col-span-6 flex flex-col h-full lg:h-[calc(100vh-100px)] lg:sticky lg:top-6">
            <CodeEditor
              control={form.control}
              register={form.register}
              watch={form.watch}
              disabled={mode === "view"}
            />

            {/* Sticky submit button for mobile/easy access */}
            <div className="hidden lg:block sticky top-6">
              {/* Reserved for potential TOC or Quick Actions */}
            </div>
          </div>

          {/* --- RIGHT COLUMN: Details Form (6 cols - 50%) --- */}
          <div className="lg:col-span-6 space-y-8">
            {/* 1. Identity & Classification (Fixed in View Mode) */}
            <section className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Problem Identity
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="problem_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problem Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Two Sum"
                          {...field}
                          disabled={mode === "view"}
                          className="bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="problem_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://codeforces.com/..."
                          {...field}
                          disabled={mode === "view"}
                          className="bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={mode === "view"}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-zinc-800/50 border-white/10 text-white">
                            <SelectValue placeholder="Select Platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PLATFORM_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contest_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contest ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 894"
                            {...field}
                            disabled={mode === "view"}
                            className="bg-zinc-800/50 border-white/10 text-white focus:border-indigo-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 1500"
                            {...field}
                            disabled={mode === "view"}
                            className="bg-zinc-800/50 border-white/10 text-white focus:border-indigo-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Tags & Patterns - Fixed in View Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <CreatableSelect
                          options={availableTags}
                          value={field.value}
                          onChange={field.onChange}
                          onCreate={(val) => {
                            const newValue = val.trim();
                            if (!newValue) return;
                            // Add to form
                            const current = field.value || [];
                            if (!current.includes(newValue)) {
                              field.onChange([...current, newValue]);
                            }
                            // Add to available options optimistically
                            setAvailableTags((prev) => [
                              ...prev,
                              { label: newValue, value: newValue },
                            ]);
                          }}
                          placeholder="Select or create tags..."
                          isMulti
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="pattern_types"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pattern Type</FormLabel>
                        <FormControl>
                          <CreatableSelect
                            options={availablePatterns}
                            value={field.value as string[]}
                            onChange={field.onChange}
                            onCreate={(val: string) => {
                              const newValue = val.trim();
                              if (!newValue) return;
                              const current = (field.value as string[]) || [];
                              if (!current.includes(newValue)) {
                                field.onChange([...current, newValue]);
                              }
                              // Optimistic update
                              setAvailablePatterns((prev) => [
                                ...prev,
                                { label: newValue, value: newValue },
                              ]);
                            }}
                            placeholder="Select or create patterns..."
                            isMulti
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pattern_subtype"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub-Pattern</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Fixed Size"
                            {...field}
                            disabled={mode === "view"}
                            className="bg-zinc-800/50 border-white/10 text-white focus:border-indigo-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>

            {/* 3. Classification & Psychology */}
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-400" /> Classify &
                Psychology
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  name="solve_status_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Solve Status
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-zinc-800/50 border-white/10 text-white focus:ring-indigo-500/50">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt}
                              value={opt}
                              className="focus:bg-zinc-800 focus:text-white"
                            >
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="idea_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Idea Source
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-zinc-800/50 border-white/10 text-white focus:ring-indigo-500/50">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                          {IDEA_SOURCE_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt}
                              value={opt}
                              className="focus:bg-zinc-800 focus:text-white"
                            >
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="perceived_difficulty_after"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Difficulty (After) -{" "}
                        <span className="text-white font-bold">
                          {field.value}
                        </span>
                        /5
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={5}
                          step={1}
                          value={[field.value]}
                          onValueChange={(val) => field.onChange(val[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="stress_level_during"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Stress Level -{" "}
                        <span className="text-white font-bold">
                          {field.value}
                        </span>
                        /10
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(val) => field.onChange(val[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="mental_load_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Mental Load -{" "}
                        <span className="text-white font-bold">
                          {field.value}
                        </span>
                        /5
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={5}
                          step={1}
                          value={[field.value]}
                          onValueChange={(val) => field.onChange(val[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="final_verdict"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Final Verdict
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-zinc-800/50 border-white/10 text-white focus:ring-indigo-500/50">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                          {VERDICT_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt}
                              value={opt}
                              className="focus:bg-zinc-800 focus:text-white"
                            >
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 4. Failure Analysis */}
            {watchedStatus !== "Solved Clean" && (
              <div className="bg-red-950/10 p-6 rounded-xl border border-red-500/20 space-y-4">
                <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Failure Analysis
                  (Mandatory)
                </h3>
                <FormField
                  name="failure_categories"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                        {FAILURE_OPTIONS.map((item) => (
                          <div
                            key={item}
                            className="flex flex-row items-center space-x-2 bg-black/20 hover:bg-black/40 p-2 rounded transition-colors border border-transparent hover:border-red-500/20"
                          >
                            <Checkbox
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value: string) => value !== item,
                                      ),
                                    );
                              }}
                              className="border-red-500/50 data-[state=checked]:bg-red-500"
                            />
                            <FormLabel className="text-xs cursor-pointer font-normal text-zinc-300">
                              {item}
                            </FormLabel>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* 5. Diagnostic Notes */}
            {watchedStatus !== "Solved Clean" && (
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Diagnostic Notes
                </h3>
                <FormField
                  name="mistakes_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Mistakes & Analysis
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="What went wrong? Be specific."
                          className="h-24 bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="learning_from_failure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Learning from Failure
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="What is the key takeaway? How to avoid this next time?"
                          className="h-24 bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* 7. Learning & Generalization */}
            <div className="bg-indigo-950/20 p-6 rounded-xl border border-indigo-500/20 space-y-4">
              <h3 className="text-lg font-semibold text-indigo-400">
                Deep Learning
              </h3>
              <FormField
                name="pattern_generalization_note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-indigo-200">
                      Pattern Generalization (When does this apply?)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="This pattern applies when..."
                        className="h-24 bg-black/40 border-indigo-500/20 text-indigo-100 placeholder:text-indigo-500/50 focus:border-indigo-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="key_learning_points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-indigo-200">
                      Key Learning Points
                    </FormLabel>
                    <FormControl>
                      <CreatableSelect
                        options={availableKeyLearnings}
                        value={field.value}
                        onChange={field.onChange}
                        onCreate={(val: string) => {
                          const newValue = val.trim();
                          if (!newValue) return;
                          const current = field.value || [];
                          if (!current.includes(newValue)) {
                            field.onChange([...current, newValue]);
                          }
                          setAvailableKeyLearnings((prev) => [
                            ...prev,
                            { label: newValue, value: newValue },
                          ]);
                        }}
                        placeholder="Select or add learning points..."
                        isMulti
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 8. Revision Checkbox */}
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5">
              <FormField
                control={form.control}
                name="must_revisit"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={mode === "view"}
                        className="border-indigo-500/50 data-[state=checked]:bg-indigo-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-white cursor-pointer">
                        Revision
                      </FormLabel>
                      <FormDescription className="text-zinc-500 text-xs">
                        Mark this problem for spaced repetition review.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* 9. Submit */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="text-zinc-400 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              {mode !== "view" && (
                <Button
                  type="submit"
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[200px] shadow-lg shadow-indigo-500/20"
                >
                  {mode === "edit" ? "Update Log" : "Save Log"}
                </Button>
              )}
              {mode === "view" && (
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 border border-indigo-400/20 backdrop-blur-md"
                >
                  Update Notes
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
