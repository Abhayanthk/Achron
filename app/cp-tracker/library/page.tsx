import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProblemTable } from "@/components/cp-tracker/ProblemTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

export default async function LibraryPage(props: {
  searchParams: Promise<{ search?: string; platform?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const search = searchParams.search;
  const platform = searchParams.platform;

  const where: any = {
    userId,
  };

  if (search) {
    where.OR = [
      { problem_name: { contains: search, mode: "insensitive" } },
      { tags: { some: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  if (platform) {
    where.platform = platform;
  }

  const logs = await prisma.problemLog.findMany({
    where,
    orderBy: {
      created_at: "desc",
    },
  });

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">Problem Library</h1>
        <p className="text-zinc-400 text-sm">
          A collection of all your solved problems and insights.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by name or tag..."
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200 focus:border-indigo-500"
            defaultValue={search}
            name="search" // In a real app, wrap in form or use client component for proper search handling
          />
        </div>
        <Button
          variant="outline"
          className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {/* @ts-ignore - Prisma types sometimes tricky with json/dates in SC */}
        <ProblemTable data={logs} />
      </div>
    </div>
  );
}
