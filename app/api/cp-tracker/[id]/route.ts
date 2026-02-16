import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Whitelist fields that can be updated here if strictly needed, 
    // or just allow updating the log generally.
    // For this specific task, we are updating 'pattern_generalization_note'.
    
    // We can just pass the body to update.
    const updatedLog = await prisma.problemLog.update({
      where: {
        id: id,
        userId: userId, // Ensure ownership
      },
      data: {
        ...body,
      },
    });

    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error("[PROBLEM_LOG_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
    try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    await prisma.problemLog.delete({
      where: {
        id: id,
        userId: userId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PROBLEM_LOG_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
