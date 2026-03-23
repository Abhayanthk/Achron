import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { codeforcesHandle: true },
    });

    return NextResponse.json({ handle: user?.codeforcesHandle || null });
  } catch (error) {
    console.error("[CF_HANDLE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { handle } = body;

    if (!handle || typeof handle !== "string") {
      return new NextResponse("Missing or invalid handle", { status: 400 });
    }

    // Verify the handle exists on Codeforces
    const cfRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${handle}`,
    );
    const cfData = await cfRes.json();

    if (cfData.status !== "OK") {
      return NextResponse.json(
        { error: "Invalid Codeforces handle" },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { codeforcesHandle: handle.trim() },
    });

    return NextResponse.json({ handle: user.codeforcesHandle });
  } catch (error) {
    console.error("[CF_HANDLE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
