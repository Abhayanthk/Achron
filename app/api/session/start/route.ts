import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { timerId } = await request.json();

    if (!timerId) {
      return new NextResponse("Missing timerId", { status: 400 });
    }

    // Verify timer belongs to user (optional but good security)
    const timer = await prisma.timer.findFirst({
        where: { id: timerId, userId }
    });

    if (!timer) {
        // If timer not found (maybe system default?), handle differently or just proceed if we allow generic sessions
        // For now, strict: must match a timer
        return new NextResponse("Timer not found", { status: 404 });
    }

    const session = await prisma.focusSession.create({
      data: {
        userId,
        timerId,
        startTime: new Date(),
        status: "ACTIVE",
        duration: 0
      },
    });

    return NextResponse.json({ sessionId: session.id }, { status: 201 });
  } catch (error: any) {
    console.error("Error starting session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
