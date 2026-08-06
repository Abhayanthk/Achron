import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Fetch one report (owner-checked) — the client polls this until DONE/FAILED. */
export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await props.params;
  const report = await prisma.trainerReport.findUnique({ where: { id } });

  if (!report || report.userId !== userId) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json(report);
}
