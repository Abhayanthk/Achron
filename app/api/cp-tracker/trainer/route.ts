import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export const runtime = "nodejs";

/**
 * Kick off a trainer analysis: create a PENDING report row and fire the Inngest
 * job that fills it in. Returns the reportId for the client to poll.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  let body: { scope?: string; contestId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const scope = body.scope === "contest" ? "contest" : "overall";
  const contestId =
    scope === "contest" ? (body.contestId ?? "").trim() : null;

  if (scope === "contest" && !contestId) {
    return NextResponse.json(
      { error: "contestId is required for contest scope" },
      { status: 400 },
    );
  }

  const report = await prisma.trainerReport.create({
    data: { userId, scope, contest_id: contestId, status: "PENDING" },
    select: { id: true },
  });

  await inngest.send({
    name: "cp-trainer/analyze.requested",
    data: { reportId: report.id, userId, scope, contestId },
  });

  return NextResponse.json({ reportId: report.id });
}

/** List the user's past reports (most recent first), with a headline preview. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const reports = await prisma.trainerReport.findMany({
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

  const list = reports.map((r) => ({
    id: r.id,
    scope: r.scope,
    contestId: r.contest_id,
    status: r.status,
    createdAt: r.created_at,
    headline:
      r.report && typeof r.report === "object" && "headline" in r.report
        ? (r.report as { headline?: string }).headline ?? null
        : null,
  }));

  return NextResponse.json({ reports: list });
}
