import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain } from "lucide-react";
import {
  TrainerClient,
  type ReportListItem,
} from "@/components/cp-tracker/trainer/TrainerClient";

export default async function TrainerPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const rows = await prisma.trainerReport.findMany({
    where: { userId },
    orderBy: { created_at: "desc" },
    take: 30,
    select: {
      id: true,
      scope: true,
      contest_id: true,
      status: true,
      created_at: true,
      report: true,
    },
  });

  const initialReports: ReportListItem[] = rows.map((r) => ({
    id: r.id,
    scope: r.scope,
    contestId: r.contest_id,
    status: r.status,
    createdAt: r.created_at.toISOString(),
    headline:
      r.report && typeof r.report === "object" && "headline" in r.report
        ? (r.report as { headline?: string }).headline ?? null
        : null,
  }));

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-400" />
            CP Trainer
          </h1>
          <p className="text-zinc-400 text-sm">
            AI coach — where your time goes, your recurring weaknesses, and how
            to fix them.
          </p>
        </div>
        <Link href="/cp-tracker">
          <Button
            variant="outline"
            className="border-zinc-800 bg-black/20 text-zinc-300 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <TrainerClient initialReports={initialReports} />
    </div>
  );
}
