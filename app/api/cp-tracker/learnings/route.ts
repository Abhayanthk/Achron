import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    const learnings = await prisma.keyLearning.findMany({
      where: {
        userId,
        point: {
          contains: query,
          mode: "insensitive",
        },
      },
      orderBy: {
        point: "asc",
      },
      take: 20,
    });

    return NextResponse.json(learnings);
  } catch (error) {
    console.error("[LEARNINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
