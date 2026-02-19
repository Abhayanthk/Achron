import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Handle revision completion action
    if (body.action === "complete_revision") {
      const existing = await prisma.problemLog.findUnique({
        where: { id, userId },
        select: { rev_level: true },
      });

      if (!existing) {
        return new NextResponse("Not found", { status: 404 });
      }

      const newLevel = Math.min(existing.rev_level + 1, 6);

      const updatedLog = await prisma.problemLog.update({
        where: { id, userId },
        data: {
          rev_level: newLevel,
          last_revised_date: new Date(),
          // Once at permanent memory (level 6), no longer needs revisiting
          ...(newLevel >= 6 ? { must_revisit: false } : {}),
        },
      });

      return NextResponse.json(updatedLog);
    }

    // General update (existing behavior)
    const updatedLog = await prisma.problemLog.update({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        ...body,
      },
    });

    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error("[PROBLEM_LOG_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
    try {
    const params = await props.params;
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    await prisma.problemLog.delete({
      where: {
        id: id,
        userId: userId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PROBLEM_LOG_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
