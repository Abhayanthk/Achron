import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify session belongs to user
    const existing = await prisma.recoverySession.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existing.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Session already completed" },
        { status: 400 },
      );
    }

    // Update session to completed
    const session = await prisma.recoverySession.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Award XP
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: 25 } },
    });

    // Log XP
    await prisma.xpLog.create({
      data: {
        userId,
        amount: 25,
        source: "RECOVERY",
        description: `Completed recovery: ${existing.triggerType} L${existing.severity}`,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("[RECOVERY_COMPLETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
