import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
// Archie a habit
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Params are async in Next.js 15+
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, archived, targetDays } = body;

    const habit = await prisma.habit.update({
      where: {
        id,
        userId,
      },
      data: {
        ...(name && { name }),
        ...(archived !== undefined && { archived }),
        ...(targetDays !== undefined && { targetDays }),
      },
    });

    return NextResponse.json(habit);
  } catch (error) {
    console.error("[HABIT_PATCH]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
// Delete a habit
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const habit = await prisma.habit.delete({
      where: {
        id,
        userId,
      },
    });

    return NextResponse.json(habit);
  } catch (error) {
    console.error("[HABIT_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
