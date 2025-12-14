import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sessionId, duration } = await request.json();

    if (!sessionId) {
      return new NextResponse("Missing sessionId", { status: 400 });
    }

    const session = await prisma.focusSession.findUnique({
        where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
        return new NextResponse("Session not found", { status: 404 });
    }

    const now = new Date();
    // Use provided duration (accurate from frontend) or fallback to wall-clock delta (if missing)
    const durationSeconds = duration !== undefined ? duration : Math.floor((now.getTime() - new Date(session.startTime).getTime()) / 1000);

    const updatedSession = await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        endTime: now,
        status: "COMPLETED",
        duration: durationSeconds
      },
    });
    
    // Also update XP (Simple gamification hook)
    // 1 XP per minute
    const xpEarned = Math.floor(durationSeconds / 60);
    if (xpEarned > 0) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                xp: { increment: xpEarned }
            }
        });
    }

    return NextResponse.json({ success: true, duration: durationSeconds }, { status: 200 });
  } catch (error: any) {
    console.error("Error ending session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
