
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const brainstorms = await prisma.brainstorm.findMany({
      where: {
        projectId: id,
        project: {
          userId: userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(brainstorms);
  } catch (error) {
    console.error("[BRAINSTORMS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name } = body;

    // Verify project belongs to user
    const project = await prisma.project.findUnique({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!project) {
        return new NextResponse("Project not found or unauthorized", { status: 404 });
    }

    const brainstorm = await prisma.brainstorm.create({
      data: {
        name: name || "Untitled Brainstorm",
        projectId: id,
        content: { elements: [], appState: {} }, // Initial empty state
      },
    });

    return NextResponse.json(brainstorm);
  } catch (error) {
    console.error("[BRAINSTORM_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
