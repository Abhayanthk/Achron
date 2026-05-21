"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { REV_LEVEL_LABELS } from "@/lib/revision";
import { FilterDropdown } from "./FilterDropdown";

export type RevisitFilter = "all" | "yes" | "no";

export type SortKey =
  | "date_desc"
  | "date_asc"
  | "rating_desc"
  | "rating_asc"
  | "difficulty_desc"
  | "difficulty_asc"
  | "rev_desc"
  | "rev_asc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc", label: "Latest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "rating_desc", label: "Rating high → low" },
  { value: "rating_asc", label: "Rating low → high" },
  { value: "difficulty_desc", label: "Difficulty high → low" },
  { value: "difficulty_asc", label: "Difficulty low → high" },
  { value: "rev_desc", label: "Rev level high → low" },
  { value: "rev_asc", label: "Rev level low → high" },
];

export interface Filters {
  platforms: string[];
  statuses: string[];
  tags: string[];
  patterns: string[];
  ratingRange: [number, number];
  difficultyRange: [number, number];
  revLevels: number[];
  revisit: RevisitFilter;
  dateFrom: string;
  dateTo: string;
  templateOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  platforms: [],
  statuses: [],
  tags: [],
  patterns: [],
  ratingRange: [0, 3500],
  difficultyRange: [0, 5],
  revLevels: [],
  revisit: "all",
  dateFrom: "",
  dateTo: "",
  templateOnly: false,
};

export function countActive(f: Filters): number {
  let n = 0;
  if (f.platforms.length) n++;
  if (f.statuses.length) n++;
  if (f.tags.length) n++;
  if (f.patterns.length) n++;
  if (f.ratingRange[0] !== 0 || f.ratingRange[1] !== 3500) n++;
  if (f.difficultyRange[0] !== 0 || f.difficultyRange[1] !== 5) n++;
  if (f.revLevels.length) n++;
  if (f.revisit !== "all") n++;
  if (f.dateFrom || f.dateTo) n++;
  if (f.templateOnly) n++;
  return n;
}

function countAdvanced(f: Filters): number {
  let n = 0;
  if (f.ratingRange[0] !== 0 || f.ratingRange[1] !== 3500) n++;
  if (f.difficultyRange[0] !== 0 || f.difficultyRange[1] !== 5) n++;
  if (f.revisit !== "all") n++;
  if (f.dateFrom || f.dateTo) n++;
  if (f.templateOnly) n++;
  return n;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  onResetAll: () => void;
  availablePlatforms: string[];
  availableStatuses: string[];
  availableTags: string[];
  availablePatterns: string[];
}

function AdvancedPanel({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="p-4 space-y-5">
      {/* Rating range */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Rating
          </label>
          <span className="text-[11px] text-zinc-300 tabular-nums">
            {filters.ratingRange[0]} – {filters.ratingRange[1]}
          </span>
        </div>
        <Slider
          min={0}
          max={3500}
          step={100}
          value={[filters.ratingRange[0], filters.ratingRange[1]]}
          onValueChange={(v) =>
            update("ratingRange", [v[0], v[1]] as [number, number])
          }
        />
      </section>

      <Separator className="bg-zinc-800" />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Perceived Difficulty
          </label>
          <span className="text-[11px] text-zinc-300 tabular-nums">
            {filters.difficultyRange[0]} – {filters.difficultyRange[1]}
          </span>
        </div>
        <Slider
          min={0}
          max={5}
          step={1}
          value={[filters.difficultyRange[0], filters.difficultyRange[1]]}
          onValueChange={(v) =>
            update("difficultyRange", [v[0], v[1]] as [number, number])
          }
        />
      </section>

      <Separator className="bg-zinc-800" />

      <section className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Must Revisit
        </label>
        <div className="flex gap-1.5">
          {(["all", "yes", "no"] as RevisitFilter[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => update("revisit", v)}
              className={cn(
                "flex-1 text-[11px] py-1.5 rounded-md border transition-colors",
                filters.revisit === v
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200",
              )}
            >
              {v === "all" ? "All" : v === "yes" ? "Revisit" : "No revisit"}
            </button>
          ))}
        </div>
      </section>

      <Separator className="bg-zinc-800" />

      <section className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update("dateFrom", e.target.value)}
            className="h-8 text-xs bg-zinc-900 border-zinc-800"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update("dateTo", e.target.value)}
            className="h-8 text-xs bg-zinc-900 border-zinc-800"
          />
        </div>
      </section>

      <Separator className="bg-zinc-800" />

      <section className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Template Used Only
        </label>
        <Switch
          checked={filters.templateOnly}
          onCheckedChange={(v) => update("templateOnly", v)}
        />
      </section>
    </div>
  );
}

export function ProblemFilters({
  filters,
  onChange,
  sort,
  onSortChange,
  onResetAll,
  availablePlatforms,
  availableStatuses,
  availableTags,
  availablePatterns,
}: Props) {
  const [advOpen, setAdvOpen] = React.useState(false);
  const totalActive = countActive(filters);
  const advCount = countAdvanced(filters);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toOptions = (arr: string[]) => arr.map((v) => ({ value: v, label: v }));

  return (
    <div className="flex flex-wrap items-end gap-2">
      <FilterDropdown
        label="Sort By"
        options={SORT_OPTIONS}
        selected={sort}
        onChange={(v) => onSortChange((v || "date_desc") as SortKey)}
        placeholder="Latest first"
        width="w-48"
      />

      <FilterDropdown
        label="Platform"
        multi
        options={toOptions(availablePlatforms)}
        selected={filters.platforms}
        onChange={(v) => update("platforms", v)}
      />

      <FilterDropdown
        label="Status"
        multi
        options={toOptions(availableStatuses)}
        selected={filters.statuses}
        onChange={(v) => update("statuses", v)}
        width="w-48"
      />

      <FilterDropdown
        label="Tags"
        multi
        searchable
        options={toOptions(availableTags)}
        selected={filters.tags}
        onChange={(v) => update("tags", v)}
      />

      <FilterDropdown
        label="Patterns"
        multi
        searchable
        options={toOptions(availablePatterns)}
        selected={filters.patterns}
        onChange={(v) => update("patterns", v)}
        width="w-52"
      />

      <FilterDropdown
        label="Rev Level"
        multi
        options={REV_LEVEL_LABELS.map((label, idx) => ({
          value: String(idx),
          label,
        }))}
        selected={filters.revLevels.map(String)}
        onChange={(v) => update("revLevels", v.map(Number))}
        width="w-40"
      />

      {/* Advanced filters */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 invisible">
          .
        </span>
        <Popover open={advOpen} onOpenChange={setAdvOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs",
                advCount > 0 && "border-indigo-500/40 text-indigo-200",
              )}
            >
              <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
              Advanced Filters
              {advCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-indigo-500/20 text-indigo-200 border-0 h-5 px-1.5 text-[10px]"
                >
                  {advCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[380px] bg-zinc-950 border-zinc-800 text-zinc-200 p-0 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-semibold">Advanced Filters</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAdvOpen(false)}
                className="h-7 w-7 p-0 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="max-h-[60vh]">
              <AdvancedPanel filters={filters} onChange={onChange} />
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Reset */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 invisible">
          .
        </span>
        <Button
          variant="ghost"
          onClick={onResetAll}
          disabled={totalActive === 0 && sort === "date_desc"}
          className="h-9 text-xs text-zinc-400 hover:text-white disabled:opacity-30"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
