import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getRecoveryAction } from "@/lib/recovery-actions";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.recoverySession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[RECOVERY_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { triggerType, severity } = body;

    if (!triggerType || !severity) {
      return NextResponse.json(
        { error: "triggerType and severity are required" },
        { status: 400 },
      );
    }

    if (severity < 1 || severity > 7) {
      return NextResponse.json(
        { error: "severity must be between 1 and 7" },
        { status: 400 },
      );
    }

    const actionAssigned = getRecoveryAction(triggerType, severity);

    const session = await prisma.recoverySession.create({
      data: {
        userId,
        triggerType,
        severity,
        actionAssigned,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("[RECOVERY_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
