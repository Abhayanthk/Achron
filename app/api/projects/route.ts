
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("search");
    const filter = searchParams.get("filter") || "ACTIVE";

    let statusFilter: any = "ACTIVE";

    switch (filter) {
      case "ALL":
        statusFilter = { in: ["ACTIVE", "PAUSED", "COMPLETED"] };
        break;
      case "ACTIVE":
        statusFilter = "ACTIVE";
        break;
      case "ON_HOLD":
        statusFilter = "PAUSED";
        break;
      case "COMPLETED":
        statusFilter = "COMPLETED";
        break;
      case "DELETED":
        statusFilter = "DELETED";
        break;
      default:
        statusFilter = "ACTIVE";
    }

    const projects = await prisma.project.findMany({
      where: {
        userId,
        status: statusFilter,
        ...(query && {
          title: {
            contains: query,
            mode: "insensitive",
          },
        }),
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        _count: {
          select: { sections: true },
        },
        sections: {
          select: { status: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, description, startDate, endDate, color } = body;

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        userId,
        title,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        color: color || "#3b82f6",
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
