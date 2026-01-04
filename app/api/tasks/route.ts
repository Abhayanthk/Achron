import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        ...(from && to
          ? {
              OR: [
                {
                  dueDate: {
                    gte: new Date(from),
                    lte: new Date(to),
                  },
                }
              ]
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[TASKS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, description, dueDate, status, categoryId } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "PENDING",
        categoryId,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASKS_POST] Validation or Database Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, dueDate, status, isCompleted, categoryId } = body;

    const task = await prisma.task.update({
      where: {
        id: taskId,
        userId,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status && { status }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(categoryId !== undefined && { categoryId }),
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASKS_PATCH]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.task.delete({
      where: {
        id: taskId,
        userId,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASKS_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
