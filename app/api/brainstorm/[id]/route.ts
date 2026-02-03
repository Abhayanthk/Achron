
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

    const brainstorm = await prisma.brainstorm.findUnique({
      where: {
        id: id,
        project: {
          userId: userId
        }
      },
    });

    if (!brainstorm) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(brainstorm);
  } catch (error) {
    console.error("[BRAINSTORM_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(
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
        const { content, name } = body;

        const brainstorm = await prisma.brainstorm.update({
            where: {
                id: id,
                project: {
                    userId: userId
                }
            },
            data: {
                content: content,
                ...(name && { name }), // Only update name if provided
            }
        });

        return NextResponse.json(brainstorm);

    } catch (error) {
        console.error("[BRAINSTORM_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        // Verify ownership via project relation before deleting
        const brainstorm = await prisma.brainstorm.delete({
            where: {
                id: id,
                project: {
                    userId: userId
                }
            }
        });

        return NextResponse.json(brainstorm);
    } catch (error) {
        console.error("[BRAINSTORM_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
