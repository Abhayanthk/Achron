import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        const { id } = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const session = await prisma.focusSession.findUnique({
            where: { id: id },
        });

        if (!session) {
             return new NextResponse("Session not found", { status: 404 });
        }

        if (session.userId !== userId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // Revert XP logic
        if (session.duration > 0) {
            const xpMock = Math.floor(session.duration / 60); // 1 XP per minute
             if (xpMock > 0) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { xp: { decrement: xpMock } }
                });
             }
        }

        await prisma.focusSession.delete({
            where: { id: id },
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error deleting session:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { duration, status } = body;

    const session = await prisma.focusSession.findUnique({
      where: { id },
    });

    if (!session || session.userId !== userId) {
      return new NextResponse("Session not found", { status: 404 });
    }

    const updatedSession = await prisma.focusSession.update({
        where: { id },
        data: {
            duration: duration !== undefined ? duration : session.duration,
            status: status !== undefined ? status : session.status,
            endTime: status === 'COMPLETED' ? new Date() : session.endTime // Set endTime on completion
        }
    });

    return NextResponse.json(updatedSession);
  } catch (error: any) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
