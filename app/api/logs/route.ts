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
    const date = searchParams.get("date");
    const search = searchParams.get("search");
    const favorites = searchParams.get("favorites");
    const id = searchParams.get("id");

    const logs = await prisma.dailyLog.findMany({
      where: {
        userId,
        ...(id && { id }),
        ...(date && {
            date: {
                gte: new Date(new Date(date).setHours(0,0,0,0)),
                lte: new Date(new Date(date).setHours(23,59,59,999)),
            }
        }),
        ...(search && {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ]
        }),
        ...(favorites === "true" && { isFavorite: true }),
      },
      include: {
        category: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[LOGS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, date, categoryId } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const log = await prisma.dailyLog.create({
      data: {
        userId,
        title,
        content,
        date: date ? new Date(date) : new Date(),
        categoryId: categoryId === "none" ? null : categoryId,
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("[LOGS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const logId = searchParams.get("logId");

    if (!logId) {
      return NextResponse.json({ error: "Log ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { isFavorite, title, content, categoryId } = body;

    const log = await prisma.dailyLog.update({
      where: {
        id: logId,
        userId,
      },
      data: {
        ...(isFavorite !== undefined && { isFavorite }),
        ...(title && { title }),
        ...(content && { content }),
        ...(categoryId !== undefined && { categoryId: categoryId === "none" ? null : categoryId }),
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("[LOGS_PATCH]", error);
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
      const logId = searchParams.get("logId");
  
      if (!logId) {
        return NextResponse.json({ error: "Log ID is required" }, { status: 400 });
      }
  
      await prisma.dailyLog.delete({
        where: {
          id: logId,
          userId,
        },
      });
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[LOGS_DELETE]", error);
      return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
  }
