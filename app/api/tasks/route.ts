import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const PRIORITY_MAP = {
  RED: 300,
  ORANGE: 200,
  YELLOW: 100,
  WHITE: 50,
};

const getPriorityFromXP = (xp: number) => {
  if (xp >= 300) return "RED";
  if (xp >= 200) return "ORANGE";
  if (xp >= 100) return "YELLOW";
  return "WHITE";
};

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

    const tasksWithPriority = tasks.map((task) => ({
      ...task,
      priority: getPriorityFromXP(task.xp),
    }));

    return NextResponse.json(tasksWithPriority);
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
    const { title, description, dueDate, status, categoryId, priority, sectionId, startDate } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
    // Category is optional if it's a project task (has sectionId), otherwise enforce it?
    // For now, let's relax it generally or check if either exists.
    // Ideally user should pick a category OR it's a project task.
    // Let's just allow null categoryId if schema supports it.
    // if (!categoryId && !sectionId) {
    //   return NextResponse.json({ error: "Category or Project Section is required" }, { status: 400 });
    // }
    
    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "PENDING",
        categoryId,
        sectionId,
        startDate: startDate ? new Date(startDate) : null, // Support timeline start date
        xp: priority ? (PRIORITY_MAP[priority as keyof typeof PRIORITY_MAP] || 50) : 50,
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
    const { title, description, dueDate, status, isCompleted, categoryId, priority } = body;

    // Fetch current task to determine XP changes
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId, userId },
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Determine new XP value if priority is changing, otherwise use current
    const newXp = priority 
      ? (PRIORITY_MAP[priority as keyof typeof PRIORITY_MAP] || 50) 
      : currentTask.xp;

    const dataToUpdate = {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status && { status }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(categoryId !== undefined && { categoryId }),
        ...(priority && { xp: newXp }),
      };

    // Prepare transaction operations
    const operations: any[] = [
      prisma.task.update({
        where: { id: taskId, userId },
        data: dataToUpdate,
      }),
    ];

    // Handle XP Update if isCompleted changed
    if (isCompleted !== undefined && isCompleted !== currentTask.isCompleted) {
        if (isCompleted) {
            // Task Completed: Add XP
            operations.push(
                prisma.user.update({
                    where: { id: userId },
                    data: { xp: { increment: newXp } }
                }),
                prisma.xpLog.create({
                    data: {
                        userId,
                        amount: newXp,
                        source: "TASK_COMPLETION",
                        description: `Completed task: ${title || currentTask.title}`
                    }
                })
            );
        } else {
            // Task Uncompleted: Remove XP
            operations.push(
                prisma.user.update({
                    where: { id: userId },
                    data: { xp: { decrement: newXp } }
                }),
                prisma.xpLog.create({
                    data: {
                        userId,
                        amount: -newXp,
                        source: "TASK_UNDO",
                        description: `Undid task: ${title || currentTask.title}`
                    }
                })
            );
        }
    }

    const results = await prisma.$transaction(operations);
    const updatedTask = results[0]; // The first operation is always the task update

    return NextResponse.json(updatedTask);
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
