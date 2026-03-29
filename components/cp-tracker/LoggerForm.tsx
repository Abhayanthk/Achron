"use client";

import React, { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Brain, AlertTriangle } from "lucide-react";
import { CreatableSelect, Option } from "@/components/ui/creatable-select";
import dynamic from "next/dynamic";
const BlockEditor = dynamic(
  () => import("@/components/ui/block-editor").then((mod) => mod.BlockEditor),
  { ssr: false },
);
import { cn } from "@/lib/utils";

// ─── Schema ──────────────────────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Shared Styles ───────────────────────────────────────────────────────────

const inputClass =
  "bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500/50";
const selectTriggerClass =
  "bg-zinc-800/50 border-white/10 text-white focus:ring-indigo-500/50";
const selectContentClass = "bg-zinc-900 border-white/10 text-white";
const selectItemClass = "focus:bg-zinc-800 focus:text-white";
const textareaClass =
  "h-24 bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500/50";

// ─── Reusable Field Components ───────────────────────────────────────────────

function SelectField({
  form,
  name,
  label,
  options,
  labelClass,
}: {
  form: any;
  name: string;
  label: string;
  options: string[];
  labelClass?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={labelClass}>{label}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent className={selectContentClass}>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt} className={selectItemClass}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SliderField({
  form,
  name,
  label,
  min,
  max,
  labelClass,
}: {
  form: any;
  name: string;
  label: string;
  min: number;
  max: number;
  labelClass?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={labelClass}>
            {label} –{" "}
            <span className="text-white font-bold">{field.value}</span>/{max}
          </FormLabel>
          <FormControl>
            <Slider
              min={min}
              max={max}
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
  );
}

function BlockEditorField({
  form,
  name,
  label,
  labelClass,
  className,
}: {
  form: any;
  name: string;
  label: string;
  labelClass?: string;
  className?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={labelClass}>{label}</FormLabel>
          <FormControl>
            <div
              className={cn(
                "rounded-md border border-white/10 bg-zinc-800/50 min-h-[120px] prose prose-invert max-w-none prose-sm p-1",
                className,
              )}
            >
              <BlockEditor
                initialContent={field.value}
                onChange={(blocks) => field.onChange(JSON.stringify(blocks))}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CreatableField({
  form,
  name,
  label,
  options,
  setOptions,
  placeholder,
  labelClass,
}: {
  form: any;
  name: string;
  label: string;
  options: Option[];
  setOptions: React.Dispatch<React.SetStateAction<Option[]>>;
  placeholder: string;
  labelClass?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={labelClass}>{label}</FormLabel>
          <FormControl>
            <CreatableSelect
              options={options}
              value={field.value}
              onChange={field.onChange}
              onCreate={(val: string) => {
                const v = val.trim();
                if (!v) return;
                const current = (field.value as string[]) || [];
                if (!current.includes(v)) field.onChange([...current, v]);
                setOptions((prev) => [...prev, { label: v, value: v }]);
              }}
              placeholder={placeholder}
              isMulti
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function LoggerForm() {
  const router = useRouter();

  // Metadata State
  const [availableTags, setAvailableTags] = React.useState<Option[]>([]);
  const [availablePatterns, setAvailablePatterns] = React.useState<Option[]>(
    [],
  );
  const [availableKeyLearnings, setAvailableKeyLearnings] = React.useState<
    Option[]
  >([]);

  const { data: metadata } = useQuery({
    queryKey: ["cp-tracker-metadata"],
    queryFn: async () => {
      const res = await fetch("/api/cp-tracker/metadata");
      if (!res.ok) throw new Error("Failed to fetch metadata");
      return res.json();
    },
  });

  // Effect to sync metadata with local state for Creatable selects
  useEffect(() => {
    if (metadata) {
      const { tags = [], patterns = [], keyLearnings = [] } = metadata;

      // Merge + deduplicate for the tags dropdown
      const merged = [...tags, ...patterns, ...keyLearnings];
      const unique = Array.from(
        new Map(merged.map((item: Option) => [item.value, item])).values(),
      );

      setAvailableTags(unique);
      setAvailablePatterns(patterns);
      setAvailableKeyLearnings(keyLearnings);
    }
  }, [metadata]);

  const defaultValues: Partial<ProblemLogFormValues> = {
    problem_name: "",
    problem_link: "",
    contest_id: "",
    rating: 0,
    tags: [],
    pattern_types: [],
    pattern_subtype: "",
    code_snippets: [],
    attempt_count: 1,
    time_to_first_idea_minutes: 0,
    implementation_time_minutes: 0,
    debug_time_minutes: 0,
    total_time_minutes: 0,
    perceived_difficulty_before: 3,
    perceived_difficulty_after: 3,
    mental_load_score: 3,
    stress_level_during: 5,
    failure_categories: [],
    mistakes_text: "",
    learning_from_failure: "",
    edge_cases_found: "",
    invariant_or_key_property: "",
    core_tricks_used: [],
    template_used: false,
    template_name: "",
    must_revisit: false,
    key_learning_points: [],
    pattern_generalization_note: "",
    similar_problems_links: [],
  };

  const form = useForm<ProblemLogFormValues>({
    resolver: zodResolver(problemLogSchema) as any,
    defaultValues,
  });

  const watchedTimeFields = form.watch([
    "time_to_first_idea_minutes",
    "implementation_time_minutes",
    "debug_time_minutes",
  ]);
  const watchedStatus = form.watch("solve_status_type");

  const totalTime =
    (Number(watchedTimeFields[0]) || 0) +
    (Number(watchedTimeFields[1]) || 0) +
    (Number(watchedTimeFields[2]) || 0);

  const mutation = useMutation({
    mutationFn: async (
      payload: ProblemLogFormValues & { total_time_minutes: number },
    ) => {
      const res = await fetch("/api/cp-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save log");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Problem logged successfully!");
      router.push("/cp-tracker");
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to save log");
      console.error(error);
    },
  });

  function onSubmit(data: ProblemLogFormValues) {
    const payload = { ...data, total_time_minutes: totalTime };
    mutation.mutate(payload);
  }

  // Scroll to first validation error
  const onValidationError = useCallback(() => {
    setTimeout(() => {
      const firstError = document.querySelector(
        '[data-error="true"], .text-destructive',
      );
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }, []);

  const showFailureSection = watchedStatus !== "Solved Clean";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onValidationError)}
        className="space-y-8 pb-32"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Left Column: Code Editor ── */}
          <div className="lg:col-span-6 flex flex-col h-full lg:h-[calc(100vh-100px)] lg:sticky lg:top-6">
            <CodeEditor
              control={form.control}
              register={form.register}
              watch={form.watch}
            />
          </div>

          {/* ── Right Column: Form Fields ── */}
          <div className="lg:col-span-6 space-y-8">
            {/* 1. Problem Identity */}
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
                          className={inputClass}
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
                          className={inputClass}
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
                            placeholder="Contest Name"
                            {...field}
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
                            placeholder="Rating"
                            {...field}
                            className="bg-zinc-800/50 border-white/10 text-white focus:border-indigo-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Tags & Patterns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <CreatableField
                  form={form}
                  name="tags"
                  label="Tags"
                  options={availableTags}
                  setOptions={setAvailableTags}
                  placeholder="Select or create tags..."
                />

                <div className="space-y-4">
                  <CreatableField
                    form={form}
                    name="pattern_types"
                    label="Pattern Type"
                    options={availablePatterns}
                    setOptions={setAvailablePatterns}
                    placeholder="Select or create patterns..."
                  />
                  <FormField
                    control={form.control}
                    name="pattern_subtype"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub-Pattern</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Sub-Pattern"
                            {...field}
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

            {/* 2. Classify & Psychology */}
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-400" /> Classify &
                Psychology
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  form={form}
                  name="solve_status_type"
                  label="Solve Status"
                  options={STATUS_OPTIONS}
                  labelClass="text-zinc-400"
                />
                <SelectField
                  form={form}
                  name="idea_source"
                  label="Idea Source"
                  options={IDEA_SOURCE_OPTIONS}
                  labelClass="text-zinc-400"
                />
                <SliderField
                  form={form}
                  name="perceived_difficulty_after"
                  label="Difficulty (After)"
                  min={1}
                  max={5}
                  labelClass="text-zinc-400"
                />
                <SliderField
                  form={form}
                  name="stress_level_during"
                  label="Stress Level"
                  min={1}
                  max={10}
                  labelClass="text-zinc-400"
                />
                <SliderField
                  form={form}
                  name="mental_load_score"
                  label="Mental Load"
                  min={1}
                  max={5}
                  labelClass="text-zinc-400"
                />
                <SelectField
                  form={form}
                  name="final_verdict"
                  label="Final Verdict"
                  options={VERDICT_OPTIONS}
                  labelClass="text-zinc-400"
                />
              </div>
            </div>

            {/* 3. Failure Analysis (conditional) */}
            {showFailureSection && (
              <div className="bg-red-950/10 p-6 rounded-xl border border-red-500/20 space-y-4">
                <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Failure Analysis
                  (Mandatory)
                </h3>
                <FormField
                  control={form.control}
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
                              onCheckedChange={(checked) =>
                                checked
                                  ? field.onChange([...field.value, item])
                                  : field.onChange(
                                      field.value?.filter(
                                        (v: string) => v !== item,
                                      ),
                                    )
                              }
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

            {/* 4. Diagnostic Notes (conditional) */}
            {showFailureSection && (
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Diagnostic Notes
                </h3>
                <BlockEditorField
                  form={form}
                  name="mistakes_text"
                  label="Mistakes & Analysis"
                  labelClass="text-zinc-400"
                />
                <BlockEditorField
                  form={form}
                  name="learning_from_failure"
                  label="Learning from Failure"
                  labelClass="text-zinc-400"
                />
              </div>
            )}

            {/* 5. Deep Learning */}
            <div className="bg-indigo-950/20 p-6 rounded-xl border border-indigo-500/20 space-y-4">
              <h3 className="text-lg font-semibold text-indigo-400">
                Deep Learning
              </h3>
              <BlockEditorField
                form={form}
                name="pattern_generalization_note"
                label="Pattern Generalization (When does this apply?)"
                labelClass="text-indigo-200"
                className="bg-black/40 border-indigo-500/20"
              />
              <CreatableField
                form={form}
                name="key_learning_points"
                label="Key Learning Points"
                options={availableKeyLearnings}
                setOptions={setAvailableKeyLearnings}
                placeholder="Select or add learning points..."
                labelClass="text-indigo-200"
              />
            </div>

            {/* 6. Revision Checkbox */}
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
                        className="border-indigo-500/50 data-[state=checked]:bg-indigo-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-white cursor-pointer">
                        Revision
                      </FormLabel>
                      <p className="text-zinc-500 text-xs">
                        Mark this problem for spaced repetition review.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* 7. Submit */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="text-zinc-400 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending || mutation.isSuccess}
                className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[200px] shadow-lg shadow-indigo-500/20"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Log"
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
