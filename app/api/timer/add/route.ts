import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, duration } = await request.json();

    if (!name || !duration) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const timer = await prisma.timer.create({
      data: {
        name,
        duration,
        userId,
      },
    });

    return NextResponse.json({ timer }, { status: 201 });
  } catch (error: any) {      
    console.error("Error adding timer:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 500 });
  }
}
