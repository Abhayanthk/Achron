import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ProblemLibraryClient } from "@/components/cp-tracker/ProblemLibraryClient";

export default async function LibraryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const logs = await prisma.problemLog.findMany({
    where: { userId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      problem_name: true,
      platform: true,
      rating: true,
      pattern_subtype: true,
      solve_status_type: true,
      perceived_difficulty_after: true,
      created_at: true,
      last_revised_date: true,
      rev_level: true,
      must_revisit: true,
      template_used: true,
      pattern_generalization_note: true,
      mistakes_text: true,
      invariant_or_key_property: true,
      edge_cases_found: true,
      learning_from_failure: true,
      core_tricks_used: true,
      failure_categories: true,
      tags: { select: { name: true } },
      patterns: { select: { name: true } },
    },
  });

  const data = logs.map((p) => ({
    ...p,
    created_at: p.created_at.toISOString(),
    last_revised_date: p.last_revised_date
      ? p.last_revised_date.toISOString()
      : null,
  }));

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <Link href="/cp-tracker">
            <Button
              variant="ghost"
              className="pl-0 text-zinc-400 hover:text-white hover:bg-transparent"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Problem Library</h1>
          <p className="text-zinc-400 text-sm">
            A collection of all your solved problems and insights.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ProblemLibraryClient problems={data} />
      </div>
    </div>
  );
}
