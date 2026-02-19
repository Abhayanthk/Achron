"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { REV_LEVEL_LABELS } from "@/lib/revision";

interface ProblemLog {
  id: string;
  problem_name: string;
  platform: string;
  rating: number;
  patterns: { name: string }[];
  solve_status_type: string;
  perceived_difficulty_after: number;
  created_at: string;
  tags: { name: string }[];
  rev_level: number;
  last_revised_date?: string | Date | null;
}

interface ProblemTableProps {
  data: ProblemLog[];
}

const statusColors: Record<string, string> = {
  "Solved Clean": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "Solved with Hint": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Solved after Editorial":
    "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  Partial: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Failed: "bg-red-500/10 text-red-500 border-red-500/20",
};

const revLevelColors: Record<number, string> = {
  0: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  1: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  2: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  3: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  4: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  5: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  6: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export function ProblemTable({ data }: ProblemTableProps) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 bg-zinc-900/10 rounded-xl border border-white/5 border-dashed">
        No problems found matching your criteria.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-white/10 bg-zinc-950/50 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-900/50">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-zinc-400 w-[15%]">
              Problem Name
            </TableHead>
            <TableHead className="text-zinc-400 w-[100px]">Platform</TableHead>
            <TableHead className="text-zinc-400 w-[80px]">Rating</TableHead>
            <TableHead className="text-zinc-400 w-[15%]">Tags</TableHead>
            <TableHead className="text-zinc-400 w-[15%]">Pattern</TableHead>
            <TableHead className="text-zinc-400 w-[120px]">Status</TableHead>
            <TableHead className="text-zinc-400 w-[80px] text-center">
              Diff
            </TableHead>
            <TableHead className="text-zinc-400 w-[80px] text-center">
              Rev
            </TableHead>
            <TableHead className="text-zinc-400 text-right w-[120px]">
              Date
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((problem) => (
            <TableRow
              key={problem.id}
              onClick={() => router.push(`/cp-tracker/log/${problem.id}`)}
              className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <TableCell className="font-medium text-zinc-200">
                {problem.problem_name}
              </TableCell>
              <TableCell className="text-zinc-400">
                {problem.platform}
              </TableCell>
              <TableCell className="text-zinc-400">{problem.rating}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {problem.tags?.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag.name}
                      variant="outline"
                      className="border-white/10 text-zinc-500 text-[10px] px-1.5 py-0 h-5"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  {problem.tags?.length > 3 && (
                    <span className="text-[10px] text-zinc-600">
                      +{problem.tags.length - 3}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-zinc-400">
                <div className="flex flex-wrap gap-1">
                  {problem.patterns?.slice(0, 2).map((p) => (
                    <Badge
                      key={p.name}
                      variant="secondary"
                      className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] px-1.5 py-0 h-5"
                    >
                      {p.name}
                    </Badge>
                  ))}
                  {problem.patterns?.length > 2 && (
                    <span className="text-[10px] text-zinc-600">
                      +{problem.patterns.length - 2}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "whitespace-nowrap",
                    statusColors[problem.solve_status_type] ||
                      "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
                  )}
                >
                  {problem.solve_status_type}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center gap-0.5 justify-center w-[80px]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 w-full rounded-full transition-all",
                        i < (problem.perceived_difficulty_after || 0)
                          ? "bg-orange-500"
                          : "bg-zinc-800",
                      )}
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-5 whitespace-nowrap",
                    revLevelColors[problem.rev_level] ?? revLevelColors[0],
                  )}
                >
                  {REV_LEVEL_LABELS[problem.rev_level] ?? "Lv 0"}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-zinc-400">
                {format(new Date(problem.created_at), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
