
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, title, order, startDate, endDate, color } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: "Project ID and Title are required" }, { status: 400 });
    }

    // Verify Project Ownership
    const project = await prisma.project.findUnique({
        where: { id: projectId, userId }
    });
    
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const section = await prisma.section.create({
      data: {
        projectId,
        title,
        order: order || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        color
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("[SECTIONS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const body = await req.json();
      const { id, title, order, startDate, endDate, color, status } = body;

      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

      // Check ownership via project
      const section = await prisma.section.findUnique({
          where: { id },
          include: { project: true }
      });

      if (!section || section.project.userId !== userId) {
          return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
      }
  
      const updatedSection = await prisma.section.update({
        where: {
          id,
        },
        data: {
          ...(title && { title }),
          ...(order !== undefined && { order }),
          ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
          ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
          ...(color && { color }),
          ...(status && { status }),
        },
      });
  
      return NextResponse.json(updatedSection);
    } catch (error) {
      console.error("[SECTIONS_PATCH]", error);
      return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
  }

  export async function DELETE(req: NextRequest) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");

      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

      // Check ownership
      const section = await prisma.section.findUnique({
          where: { id },
          include: { project: true }
      });

      if (!section || section.project.userId !== userId) {
        return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }
  
      await prisma.section.delete({
        where: {
          id,
        },
      });
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[SECTIONS_DELETE]", error);
      return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
  }
