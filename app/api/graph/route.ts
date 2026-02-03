import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const notes = await prisma.note.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        title: true,
        type: true,
        parentId: true,
        updatedAt: true,
      }
    });

    console.log("[GRAPH_API] Found notes:", notes.length);
    
    return NextResponse.json(notes);
  } catch (error) {
    console.error("[GRAPH_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
