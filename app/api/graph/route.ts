import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: {
        userId,
        status: { not: "DELETED" }, // Fetch all active projects
      },
      select: {
        id: true,
        title: true,
        color: true,
        brainstorms: {
          select: {
            id: true,
            name: true,
            updatedAt: true
          }
        }
      }
    });

    console.log("[GRAPH_API] Found projects:", projects.length);
    projects.forEach(p => console.log(`- Project: ${p.title} (${p.id}), Brainstorms: ${p.brainstorms.length}`));

    return NextResponse.json(projects);
  } catch (error) {
    console.error("[GRAPH_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
