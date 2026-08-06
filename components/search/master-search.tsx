"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Command as CommandPrimitive } from "cmdk";
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Home,
  Map,
  ListChecks,
  Timer,
  ShieldCheck,
  CalendarSync,
  HeartPulse,
  SquareKanban,
  BookOpenText,
  Network,
  Calendar,
  SquareTerminal,
  Plus,
  Play,
  FileText,
  Loader2,
  Clock,
  ArrowRight,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  score: number;
}

interface HistoryEntry {
  id: string;
  query: string;
  type: string;
  title: string;
  url: string;
  timestamp: number;
  count: number;
}

const HISTORY_KEY = "archon-search-history";
const MAX_HISTORY = 50;

const pages = [
  { title: "Home", url: "/dashboard", icon: Home, keywords: ["dashboard", "overview"] },
  { title: "My Journey", url: "/journey", icon: Map, keywords: ["progress", "growth", "xp"] },
  { title: "Tasks", url: "/tasks", icon: ListChecks, keywords: ["todo", "task", "work"] },
  { title: "Timer", url: "/timer", icon: Timer, keywords: ["focus", "pomodoro", "session"] },
  { title: "Evidence Log", url: "/daily-log", icon: ShieldCheck, keywords: ["daily", "card", "evidence"] },
  { title: "Habits", url: "/habits", icon: CalendarSync, keywords: ["streak", "track", "routine"] },
  { title: "Recovery", url: "/recovery", icon: HeartPulse, keywords: ["rest", "break", "burnout"] },
  { title: "Projects", url: "/projects", icon: SquareKanban, keywords: ["kanban", "board", "project"] },
  { title: "Daily Logs", url: "/logs", icon: BookOpenText, keywords: ["journal", "log", "write"] },
  { title: "Notes", url: "/notes", icon: Network, keywords: ["note", "canvas", "graph"] },
  { title: "Calendar", url: "/calendar", icon: Calendar, keywords: ["schedule", "event", "plan"] },
  { title: "CP Tracker", url: "/cp-tracker", icon: SquareTerminal, keywords: ["competitive", "programming", "problem", "codeforces"] },
];

const actions = [
  { title: "New Task", url: "/tasks", icon: Plus, keywords: ["create", "add", "task"] },
  { title: "Write Daily Log", url: "/logs/new", icon: FileText, keywords: ["create", "journal", "write"] },
  { title: "Start Focus Timer", url: "/timer", icon: Play, keywords: ["start", "focus", "pomodoro"] },
  { title: "New Project", url: "/projects", icon: Plus, keywords: ["create", "project"] },
];

const typeIcons: Record<string, LucideIcon> = {
  task: ListChecks,
  note: Network,
  project: SquareKanban,
  log: BookOpenText,
  habit: CalendarSync,
  problem: SquareTerminal,
  brainstorm: Lightbulb,
  event: Calendar,
};

const typeLabels: Record<string, string> = {
  task: "Tasks",
  note: "Notes",
  project: "Projects",
  log: "Daily Logs",
  habit: "Habits",
  problem: "CP Problems",
  brainstorm: "Brainstorms",
  event: "Calendar Events",
};

const typeBadgeColors: Record<string, string> = {
  task: "bg-blue-500/15 text-blue-400",
  note: "bg-purple-500/15 text-purple-400",
  project: "bg-green-500/15 text-green-400",
  log: "bg-amber-500/15 text-amber-400",
  habit: "bg-cyan-500/15 text-cyan-400",
  problem: "bg-orange-500/15 text-orange-400",
  brainstorm: "bg-pink-500/15 text-pink-400",
  event: "bg-indigo-500/15 text-indigo-400",
};

function frecencyScore(entry: HistoryEntry): number {
  const daysSince = (Date.now() - entry.timestamp) / (24 * 60 * 60 * 1000);
  return entry.count * Math.exp(-daysSince / 30);
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

function updateHistory(
  history: HistoryEntry[],
  item: { type: string; id: string; title: string; url: string },
  query: string,
): HistoryEntry[] {
  const key = `${item.type}:${item.id}`;
  const existing = history.find((h) => `${h.type}:${h.id}` === key);
  if (existing) {
    return history.map((h) =>
      `${h.type}:${h.id}` === key
        ? { ...h, timestamp: Date.now(), count: h.count + 1, query }
        : h,
    );
  }
  return [
    {
      id: item.id,
      query,
      type: item.type,
      title: item.title,
      url: item.url,
      timestamp: Date.now(),
      count: 1,
    },
    ...history,
  ].slice(0, MAX_HISTORY);
}

export function MasterSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const searchContent = useDebouncedCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!controller.signal.aborted) {
        setResults(data.results || []);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setResults([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, 300);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.length >= 2) {
        setLoading(true);
      }
      searchContent(value);
    },
    [searchContent],
  );

  const handleSelect = useCallback(
    (item: { type: string; id: string; title: string; url: string }) => {
      const newHistory = updateHistory(history, item, query);
      setHistory(newHistory);
      saveHistory(newHistory);
      setOpen(false);
      setQuery("");
      setResults([]);
      router.push(item.url);
    },
    [history, query, router],
  );

  const handleOpenChange = useCallback((open: boolean) => {
    setOpen(open);
    if (!open) {
      setQuery("");
      setResults([]);
      setLoading(false);
    }
  }, []);

  const hasQuery = query.length > 0;
  const lowerQuery = query.toLowerCase();

  const filteredPages = hasQuery
    ? pages.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerQuery) ||
          p.url.toLowerCase().includes(lowerQuery) ||
          p.keywords?.some((k) => k.includes(lowerQuery)),
      )
    : pages;

  const filteredActions = hasQuery
    ? actions.filter(
        (a) =>
          a.title.toLowerCase().includes(lowerQuery) ||
          a.keywords?.some((k) => k.includes(lowerQuery)),
      )
    : actions;

  const groupedResults = results.reduce<Record<string, SearchResult[]>>(
    (acc, r) => {
      (acc[r.type] ||= []).push(r);
      return acc;
    },
    {},
  );

  const recentHistory = history
    .map((h) => ({ ...h, frecency: frecencyScore(h) }))
    .sort((a, b) => b.frecency - a.frecency)
    .slice(0, 5);

  const historyMatchedToQuery = hasQuery
    ? history
        .filter(
          (h) =>
            h.title.toLowerCase().includes(lowerQuery) ||
            h.query.toLowerCase().includes(lowerQuery),
        )
        .sort((a, b) => frecencyScore(b) - frecencyScore(a))
        .slice(0, 3)
    : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="top-[25%] translate-y-0 max-w-2xl p-0 gap-0 bg-zinc-950/95 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_0_60px_-15px_rgba(255,255,255,0.1)] overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>
            Search pages, tasks, notes, projects and more
          </DialogDescription>
        </DialogHeader>

        <Command shouldFilter={false} className="bg-transparent">
          <div className="flex items-center gap-3 px-4 h-14 border-b border-white/10">
            <Search className="size-5 text-zinc-500 shrink-0" />
            <CommandPrimitive.Input
              placeholder="Search pages, tasks, notes, projects..."
              value={query}
              onValueChange={handleQueryChange}
              className="flex-1 bg-transparent text-[15px] text-white placeholder:text-zinc-500 outline-none"
            />
            {loading && (
              <Loader2 className="size-4 text-zinc-500 animate-spin shrink-0" />
            )}
            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-md bg-zinc-800/80 border border-zinc-700/50 px-2 text-[11px] font-medium text-zinc-500 shrink-0">
              ⌘K
            </kbd>
          </div>

          <CommandList className="max-h-[400px] overflow-y-auto scrollbar-thin">
            {/* Recent — only when no query */}
            {!hasQuery && recentHistory.length > 0 && (
              <CommandGroup heading="Recent">
                {recentHistory.map((h) => {
                  const TypeIcon = typeIcons[h.type] || Clock;
                  return (
                    <CommandItem
                      key={`recent-${h.type}-${h.id}`}
                      value={`recent-${h.type}-${h.id}`}
                      onSelect={() => handleSelect(h)}
                      className="mx-2 rounded-xl px-3 py-2.5 cursor-pointer text-zinc-400 data-[selected=true]:bg-white data-[selected=true]:text-black data-[selected=true]:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-200"
                    >
                      <Clock className="size-4 mr-3 shrink-0 opacity-50" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {h.title}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${typeBadgeColors[h.type] || "bg-zinc-800 text-zinc-500"}`}
                      >
                        {typeLabels[h.type] || h.type}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* History matches — when typing */}
            {hasQuery && historyMatchedToQuery.length > 0 && (
              <CommandGroup heading="Previously visited">
                {historyMatchedToQuery.map((h) => (
                  <CommandItem
                    key={`hist-${h.type}-${h.id}`}
                    value={`hist-${h.type}-${h.id}`}
                    onSelect={() => handleSelect(h)}
                    className="mx-2 rounded-xl px-3 py-2.5 cursor-pointer text-zinc-400 data-[selected=true]:bg-white data-[selected=true]:text-black data-[selected=true]:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-200"
                  >
                    <Clock className="size-4 mr-3 shrink-0 opacity-50" />
                    <span className="text-sm font-medium truncate flex-1">
                      {h.title}
                    </span>
                    <ArrowRight className="size-3.5 opacity-30 shrink-0" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Pages */}
            {filteredPages.length > 0 && (
              <CommandGroup heading="Pages">
                {filteredPages.map((page) => (
                  <CommandItem
                    key={`page-${page.url}`}
                    value={`page-${page.url}`}
                    onSelect={() =>
                      handleSelect({
                        type: "page",
                        id: page.url,
                        title: page.title,
                        url: page.url,
                      })
                    }
                    className="mx-2 rounded-xl px-3 py-2.5 cursor-pointer text-zinc-400 data-[selected=true]:bg-white data-[selected=true]:text-black data-[selected=true]:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-200"
                  >
                    <page.icon className="size-4 mr-3 shrink-0" />
                    <span className="text-sm font-medium">{page.title}</span>
                    <span className="ml-auto text-xs text-zinc-600 truncate max-w-[120px]">
                      {page.url}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Quick Actions */}
            {filteredActions.length > 0 && (
              <CommandGroup heading="Quick Actions">
                {filteredActions.map((action) => (
                  <CommandItem
                    key={`action-${action.title}`}
                    value={`action-${action.title}`}
                    onSelect={() =>
                      handleSelect({
                        type: "action",
                        id: action.url,
                        title: action.title,
                        url: action.url,
                      })
                    }
                    className="mx-2 rounded-xl px-3 py-2.5 cursor-pointer text-zinc-400 data-[selected=true]:bg-white data-[selected=true]:text-black data-[selected=true]:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-200"
                  >
                    <action.icon className="size-4 mr-3 shrink-0" />
                    <span className="text-sm font-medium">{action.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Semantic content results — grouped by type */}
            {hasQuery &&
              Object.entries(groupedResults).map(([type, items]) => {
                const TypeIcon = typeIcons[type] || FileText;
                const label = typeLabels[type] || type;
                return (
                  <CommandGroup key={type} heading={label}>
                    {items.map((item) => (
                      <CommandItem
                        key={`result-${item.type}-${item.id}`}
                        value={`result-${item.type}-${item.id}`}
                        onSelect={() => handleSelect(item)}
                        className="mx-2 rounded-xl px-3 py-2.5 cursor-pointer text-zinc-400 data-[selected=true]:bg-white data-[selected=true]:text-black data-[selected=true]:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-200"
                      >
                        <TypeIcon className="size-4 mr-3 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="text-xs text-zinc-600 truncate block">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${typeBadgeColors[type] || "bg-zinc-800 text-zinc-500"}`}
                        >
                          {Math.round(item.score * 100)}%
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}

            {/* Loading skeleton for content */}
            {hasQuery && loading && results.length === 0 && (
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-4 rounded bg-zinc-800 animate-pulse" />
                  <div className="h-4 w-48 rounded bg-zinc-800 animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-4 rounded bg-zinc-800 animate-pulse" />
                  <div className="h-4 w-36 rounded bg-zinc-800 animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-4 rounded bg-zinc-800 animate-pulse" />
                  <div className="h-4 w-56 rounded bg-zinc-800 animate-pulse" />
                </div>
              </div>
            )}

            {/* Empty state */}
            {hasQuery &&
              !loading &&
              filteredPages.length === 0 &&
              filteredActions.length === 0 &&
              results.length === 0 &&
              historyMatchedToQuery.length === 0 && (
                <CommandEmpty className="py-12 text-zinc-500">
                  No results for &quot;{query}&quot;
                </CommandEmpty>
              )}
          </CommandList>

          {/* Footer with keyboard hints */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/5 text-[11px] text-zinc-600">
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center rounded bg-zinc-800/60 px-1.5 text-[10px] font-medium">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center rounded bg-zinc-800/60 px-1.5 text-[10px] font-medium">
                ↵
              </kbd>
              Open
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center rounded bg-zinc-800/60 px-1.5 text-[10px] font-medium">
                Esc
              </kbd>
              Close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
