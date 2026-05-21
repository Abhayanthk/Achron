"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Search, Sparkles, X, Loader2 } from "lucide-react";
import { useDebounce } from "use-debounce";
import { ProblemTable } from "@/components/cp-tracker/ProblemTable";
import {
  ProblemFilters,
  Filters,
  DEFAULT_FILTERS,
  SortKey,
} from "@/components/cp-tracker/ProblemFilters";
import { cn } from "@/lib/utils";

interface RawProblem {
  id: string;
  problem_name: string;
  platform: string;
  rating: number;
  pattern_subtype: string | null;
  patterns: { name: string }[];
  solve_status_type: string;
  perceived_difficulty_after: number;
  created_at: string;
  tags: { name: string }[];
  rev_level: number;
  last_revised_date: string | null;
  must_revisit: boolean;
  template_used: boolean;
  pattern_generalization_note: string;
  mistakes_text: string;
  invariant_or_key_property: string | null;
  edge_cases_found: string | null;
  learning_from_failure: string | null;
  core_tricks_used: string[];
  failure_categories: string[];
}

interface Props {
  problems: RawProblem[];
}

const SEMANTIC_THRESHOLD = 0.55;

function matchesText(p: RawProblem, q: string): boolean {
  const lower = q.toLowerCase();
  const hay = [
    p.problem_name,
    p.platform,
    p.pattern_subtype,
    p.solve_status_type,
    p.invariant_or_key_property,
    p.pattern_generalization_note,
    p.mistakes_text,
    p.edge_cases_found,
    p.learning_from_failure,
    ...p.core_tricks_used,
    ...p.failure_categories,
    ...p.tags.map((t) => t.name),
    ...p.patterns.map((x) => x.name),
  ]
    .filter(Boolean)
    .join("  ")
    .toLowerCase();
  return hay.includes(lower);
}

function applySort(list: RawProblem[], sort: SortKey): RawProblem[] {
  const sorted = [...list];
  switch (sort) {
    case "date_desc":
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      break;
    case "date_asc":
      sorted.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      break;
    case "rating_desc":
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case "rating_asc":
      sorted.sort((a, b) => a.rating - b.rating);
      break;
    case "difficulty_desc":
      sorted.sort(
        (a, b) =>
          (b.perceived_difficulty_after ?? 0) -
          (a.perceived_difficulty_after ?? 0),
      );
      break;
    case "difficulty_asc":
      sorted.sort(
        (a, b) =>
          (a.perceived_difficulty_after ?? 0) -
          (b.perceived_difficulty_after ?? 0),
      );
      break;
    case "rev_desc":
      sorted.sort((a, b) => b.rev_level - a.rev_level);
      break;
    case "rev_asc":
      sorted.sort((a, b) => a.rev_level - b.rev_level);
      break;
  }
  return sorted;
}

export function ProblemLibraryClient({ problems }: Props) {
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = React.useState<SortKey>("date_desc");
  const [query, setQuery] = React.useState("");
  const [debouncedQuery] = useDebounce(query, 350);
  const [semanticOn, setSemanticOn] = React.useState(true);
  const [scores, setScores] = React.useState<Record<string, number>>({});
  const [searching, setSearching] = React.useState(false);
  const [semError, setSemError] = React.useState<string | null>(null);

  const availablePlatforms = React.useMemo(
    () =>
      Array.from(
        new Set(problems.map((p) => p.platform).filter(Boolean)),
      ).sort(),
    [problems],
  );
  const availableStatuses = React.useMemo(
    () =>
      Array.from(
        new Set(problems.map((p) => p.solve_status_type).filter(Boolean)),
      ).sort(),
    [problems],
  );
  const availableTags = React.useMemo(
    () =>
      Array.from(
        new Set(problems.flatMap((p) => p.tags.map((t) => t.name))),
      ).sort(),
    [problems],
  );
  const availablePatterns = React.useMemo(
    () =>
      Array.from(
        new Set(problems.flatMap((p) => p.patterns.map((x) => x.name))),
      ).sort(),
    [problems],
  );

  React.useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q || !semanticOn) {
      setScores({});
      setSemError(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setSemError(null);
    fetch("/api/cp-tracker/semantic-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: { scores: Record<string, number> }) => {
        if (!cancelled) setScores(data.scores || {});
      })
      .catch((err) => {
        if (!cancelled) setSemError(err.message || "Search failed");
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, semanticOn]);

  const filtered = React.useMemo(() => {
    const q = debouncedQuery.trim();
    const useSemantic =
      semanticOn && q.length > 0 && Object.keys(scores).length > 0;

    let list = problems.filter((p) => {
      if (filters.platforms.length && !filters.platforms.includes(p.platform))
        return false;
      if (
        filters.statuses.length &&
        !filters.statuses.includes(p.solve_status_type)
      )
        return false;
      if (
        filters.tags.length &&
        !p.tags.some((t) => filters.tags.includes(t.name))
      )
        return false;
      if (
        filters.patterns.length &&
        !p.patterns.some((x) => filters.patterns.includes(x.name))
      )
        return false;
      if (
        p.rating < filters.ratingRange[0] ||
        p.rating > filters.ratingRange[1]
      )
        return false;
      const diff = p.perceived_difficulty_after ?? 0;
      if (
        diff < filters.difficultyRange[0] ||
        diff > filters.difficultyRange[1]
      )
        return false;
      if (filters.revLevels.length && !filters.revLevels.includes(p.rev_level))
        return false;
      if (filters.revisit === "yes" && !p.must_revisit) return false;
      if (filters.revisit === "no" && p.must_revisit) return false;
      if (filters.templateOnly && !p.template_used) return false;
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        if (new Date(p.created_at) < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(p.created_at) > to) return false;
      }
      if (q) {
        if (useSemantic) {
          const score = scores[p.id] ?? 0;
          if (score < SEMANTIC_THRESHOLD && !matchesText(p, q)) return false;
        } else {
          if (!matchesText(p, q)) return false;
        }
      }
      return true;
    });

    if (useSemantic) {
      list = [...list].sort(
        (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0),
      );
    } else {
      list = applySort(list, sort);
    }
    return list;
  }, [problems, filters, sort, debouncedQuery, scores, semanticOn]);

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS);
    setSort("date_desc");
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Search row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[280px] max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder={
              semanticOn
                ? "Semantic search… e.g. 'problems where I missed an invariant'"
                : "Keyword search by name, tag, pattern, notes…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 pl-9 pr-9 bg-zinc-900 border-zinc-800 text-zinc-200 focus:border-indigo-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-200"
            >
              {searching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {!query && searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 animate-spin" />
          )}
        </div>

        <label
          className={cn(
            "flex items-center gap-2 h-10 px-3 rounded-md border text-xs cursor-pointer select-none",
            semanticOn
              ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200"
              : "border-zinc-800 bg-zinc-900 text-zinc-400",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Semantic
          <Switch
            checked={semanticOn}
            onCheckedChange={setSemanticOn}
            className="ml-1 scale-75 -mr-1"
          />
        </label>
      </div>

      {/* Filter row */}
      <ProblemFilters
        filters={filters}
        onChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        onResetAll={resetAll}
        availablePlatforms={availablePlatforms}
        availableStatuses={availableStatuses}
        availableTags={availableTags}
        availablePatterns={availablePatterns}
      />

      {/* Status row */}
      <div className="flex items-center gap-3 text-[11px] text-zinc-500 min-h-[18px]">
        <span>
          Showing{" "}
          <span className="text-zinc-300 font-medium">{filtered.length}</span>{" "}
          of {problems.length}
        </span>
        {semError && <span className="text-red-400">Semantic: {semError}</span>}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <ProblemTable data={filtered} />
      </div>
    </div>
  );
}
