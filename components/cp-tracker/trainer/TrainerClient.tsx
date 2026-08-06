"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { CoachReport } from "./CoachReport";
import type { CoachingReport } from "@/lib/cp-trainer/agent";

export type ReportListItem = {
  id: string;
  scope: string;
  contestId: string | null;
  status: string;
  createdAt: string;
  headline: string | null;
};

type ReportDetail = {
  id: string;
  status: string;
  scope: string;
  contest_id: string | null;
  report: CoachingReport | null;
  error: string | null;
  model: string | null;
};

const ACTIVE_STATUSES = new Set(["PENDING", "RUNNING"]);

function truncate(s: string, n = 64): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function statusLabel(status: string): string {
  if (status === "PENDING") return "Queued…";
  if (status === "RUNNING") return "Analyzing your contests…";
  return status;
}

async function fetchContests(): Promise<string[]> {
  const res = await fetch("/api/cp-tracker/trainer/contests");
  if (!res.ok) return [];
  return (await res.json()).contests ?? [];
}

async function fetchReportList(): Promise<ReportListItem[]> {
  const res = await fetch("/api/cp-tracker/trainer");
  if (!res.ok) return [];
  return (await res.json()).reports ?? [];
}

async function fetchReport(id: string): Promise<ReportDetail> {
  const res = await fetch(`/api/cp-tracker/trainer/${id}`);
  if (!res.ok) throw new Error("Failed to load report");
  return res.json();
}

export function TrainerClient({
  initialReports,
}: {
  initialReports: ReportListItem[];
}) {
  const qc = useQueryClient();
  const [scope, setScope] = React.useState<"overall" | "contest">("overall");
  const [contestId, setContestId] = React.useState<string>("");
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const contestsQ = useQuery({
    queryKey: ["cp-trainer-contests"],
    queryFn: fetchContests,
  });

  const reportsQ = useQuery({
    queryKey: ["cp-trainer-reports"],
    queryFn: fetchReportList,
    initialData: initialReports,
  });

  const reportQ = useQuery({
    queryKey: ["cp-trainer-report", activeId],
    queryFn: () => fetchReport(activeId as string),
    enabled: !!activeId,
    refetchInterval: (query) =>
      ACTIVE_STATUSES.has(
        (query.state.data as ReportDetail | undefined)?.status ?? "",
      )
        ? 2500
        : false,
  });

  // Refresh the history list once a run reaches a terminal state.
  const activeStatus = reportQ.data?.status;
  React.useEffect(() => {
    if (activeStatus === "DONE" || activeStatus === "FAILED") {
      qc.invalidateQueries({ queryKey: ["cp-trainer-reports"] });
    }
  }, [activeStatus, qc]);

  const analyze = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cp-tracker/trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          contestId: scope === "contest" ? contestId : undefined,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Failed to start analysis");
      }
      return (await res.json()).reportId as string;
    },
    onSuccess: (id) => setActiveId(id),
  });

  const contests = contestsQ.data ?? [];
  const canAnalyze =
    !analyze.isPending &&
    (scope === "overall" || (scope === "contest" && !!contestId));
  const isBusy =
    analyze.isPending ||
    (!!reportQ.data && ACTIVE_STATUSES.has(reportQ.data.status));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-800 bg-black/20 p-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-400">Scope</label>
          <Select
            value={scope}
            onValueChange={(v) => {
              const next = v as "overall" | "contest";
              setScope(next);
              if (next === "contest" && !contestId && contests.length > 0) {
                setContestId(contests[0]);
              }
            }}
          >
            <SelectTrigger className="w-52 border-zinc-800 bg-black/30 text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall (all CF)</SelectItem>
              <SelectItem value="contest">Per contest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {scope === "contest" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-400">Contest</label>
            <Select value={contestId} onValueChange={setContestId}>
              <SelectTrigger className="w-72 border-zinc-800 bg-black/30 text-zinc-200">
                <SelectValue placeholder="Select a contest" />
              </SelectTrigger>
              <SelectContent>
                {contests.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No CF contests logged
                  </SelectItem>
                ) : (
                  contests.map((c) => (
                    <SelectItem key={c} value={c}>
                      {truncate(c)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          onClick={() => analyze.mutate()}
          disabled={!canAnalyze}
          className="bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {analyze.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Analyze
        </Button>
      </div>

      {/* Errors from kicking off */}
      {analyze.isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4" />
          {(analyze.error as Error).message}
        </div>
      )}

      {/* Active analysis */}
      {activeId && (
        <div>
          {isBusy || reportQ.isLoading ? (
            <div className="space-y-4 rounded-xl border border-zinc-800 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-sm text-indigo-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                {statusLabel(reportQ.data?.status ?? "PENDING")}
              </div>
              <Skeleton className="h-6 w-2/3 bg-zinc-800" />
              <Skeleton className="h-24 w-full bg-zinc-800" />
              <Skeleton className="h-24 w-full bg-zinc-800" />
            </div>
          ) : reportQ.data?.status === "FAILED" ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Analysis failed</p>
                <p className="text-red-300/80">
                  {reportQ.data.error ?? "Unknown error."}
                </p>
              </div>
            </div>
          ) : reportQ.data?.report ? (
            <CoachReport report={reportQ.data.report} />
          ) : null}
        </div>
      )}

      {/* History */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Past analyses
        </h3>
        {reportsQ.data && reportsQ.data.length > 0 ? (
          <ul className="space-y-2">
            {reportsQ.data.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setActiveId(r.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                    activeId === r.id
                      ? "border-indigo-500/40 bg-indigo-500/10"
                      : "border-zinc-800 bg-black/20 hover:bg-white/5"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-zinc-200">
                      {r.headline ??
                        (r.scope === "contest"
                          ? truncate(r.contestId ?? "Contest")
                          : "Overall analysis")}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {r.scope === "contest"
                        ? truncate(r.contestId ?? "", 40)
                        : "All Codeforces"}{" "}
                      · {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      r.status === "DONE"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : r.status === "FAILED"
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {r.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">
            No analyses yet — run one above.
          </p>
        )}
      </div>
    </div>
  );
}
