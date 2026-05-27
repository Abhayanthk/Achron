import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, duration, type, color } = body;

    const timer = await prisma.timer.findUnique({ where: { id } });
    if (!timer || timer.userId !== userId) {
      return new NextResponse("Not found", { status: 404 });
    }

    const updated = await prisma.timer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(duration !== undefined && { duration }),
        ...(type !== undefined && { type }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json({ timer: updated });
  } catch (error: any) {
    console.error("Error updating timer:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const timer = await prisma.timer.findUnique({ where: { id } });
    if (!timer || timer.userId !== userId) {
      return new NextResponse("Not found", { status: 404 });
    }

    await prisma.timer.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting timer:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }
}
