import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, duration, type, color } = await request.json();
    if (!name || !duration) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const timer = await prisma.timer.create({
      data: {
        name,
        duration,
        type: type || "FOCUS",
        color: color || "bg-blue-500",
        userId,
      },
    });

    return NextResponse.json({ timer }, { status: 201 });
  } catch (error: any) {      
    console.error("Error adding timer:", error);
    return NextResponse.json({ error: error.message, stack: error.stack, details: error }, { status: 500 });
  }
}
