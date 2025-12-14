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

    let validTimerId = null;

    if (timerId) {
      // Verify timer belongs to user
      const timer = await prisma.timer.findFirst({
        where: { id: timerId, userId },
      });

      if (!timer) {
        console.warn(`Timer ${timerId} not found for user ${userId}, creating generic session.`);
        validTimerId = null;
      } else {
        validTimerId = timer.id;
      }
    }

    const session = await prisma.focusSession.create({
      data: {
        userId,
        timerId: validTimerId,
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
