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

interface ProblemLog {
  id: string;
  problem_name: string;
  platform: string;
  rating: number;
  pattern_type: string;
  solve_status_type: string;
  total_time_minutes: number;
  created_at: string;
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
            <TableHead className="text-zinc-400">Problem Name</TableHead>
            <TableHead className="text-zinc-400 w-[100px]">Platform</TableHead>
            <TableHead className="text-zinc-400 w-[80px]">Rating</TableHead>
            <TableHead className="text-zinc-400">Pattern</TableHead>
            <TableHead className="text-zinc-400">Status</TableHead>
            <TableHead className="text-zinc-400 text-right w-[100px]">
              Time
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
              <TableCell className="text-zinc-400">
                {problem.pattern_type}
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
              <TableCell className="text-right text-zinc-400">
                {problem.total_time_minutes}m
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
