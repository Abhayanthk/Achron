"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import {
  Loader2,
  Plus,
  Search,
  Calendar,
  Star,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { extractPlainText } from "@/lib/block-utils";

interface DailyLog {
  id: string;
  title: string;
  content: string;
  date: string;
  isFavorite: boolean;
}

export default function LogsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["logs", search, dateFilter, showFavorites],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (dateFilter) params.append("date", dateFilter);
      if (showFavorites) params.append("favorites", "true");

      const res = await axios.get(`/api/logs?${params.toString()}`);
      return res.data;
    },
  });

  const { mutate: deleteLog } = useMutation({
    mutationFn: async (id: string) => {
      return axios.delete(`/api/logs?logId=${id}`);
    },
    onSuccess: () => {
      toast.success("Log deleted");
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });

  const { mutate: toggleFavorite } = useMutation({
    mutationFn: async ({
      id,
      isFavorite,
    }: {
      id: string;
      isFavorite: boolean;
    }) => {
      return axios.patch(`/api/logs?logId=${id}`, { isFavorite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 relative">
      {/* Ambient Bg */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-500 hover:text-white mr-2"
                >
                  <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Daily Logs</h1>
            </div>
            <p className="text-zinc-500 text-sm pl-10">
              Capture your journey, one day at a time.
            </p>
          </div>
          <Link href="/logs/new">
            <Button className="bg-white text-black hover:bg-zinc-200">
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-transparent border-none focus-visible:ring-0 placeholder:text-zinc-600"
            />
          </div>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-2 px-2">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-sm text-zinc-400 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="text-xs text-red-400 hover:text-red-300 ml-1"
              >
                Clear
              </button>
            )}
          </div>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFavorites(!showFavorites)}
            className={cn(
              "gap-2 hover:bg-white/5",
              showFavorites
                ? "text-yellow-400 hover:text-yellow-300"
                : "text-zinc-500",
            )}
          >
            <Star className={cn("h-4 w-4", showFavorites && "fill-current")} />
            Favorites
          </Button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
            </div>
          ) : logs?.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
              <p className="text-zinc-500">
                No logs found matching your criteria.
              </p>
            </div>
          ) : (
            logs?.map((log: DailyLog) => (
              <div
                key={log.id}
                className="group relative bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-white/10 p-6 rounded-2xl transition-all cursor-pointer"
                onClick={() => router.push(`/logs/new?edit=${log.id}`)} // Ideally we'd have edit mode, for now redirect to new with params (or implement edit support in new page)
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-zinc-100 group-hover:text-white transition-colors">
                        {log.title}
                      </h3>
                      {/* Date Badge */}
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 border border-white/5">
                        {format(new Date(log.date), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-zinc-500 line-clamp-2 text-sm leading-relaxed">
                      {extractPlainText(log.content)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-zinc-500 hover:text-yellow-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite({
                          id: log.id,
                          isFavorite: !log.isFavorite,
                        });
                      }}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          log.isFavorite && "fill-yellow-400 text-yellow-400",
                        )}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLog(log.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Always visible Favorite indicator if favored */}
                {log.isFavorite && (
                  <div className="absolute top-6 right-6 text-yellow-500/20 group-hover:opacity-0 transition-opacity pointer-events-none">
                    <Star className="h-6 w-6 fill-current" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
