import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { userId } = await auth();
    const { noteId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify ownership
    const existingNote = await prisma.note.findUnique({
      where: {
        id: noteId,
        userId,
      },
    });

    if (!existingNote) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.note.delete({
      where: {
        id: noteId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[NOTES_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
    try {
        const { userId } = await auth();
        const { noteId } = await params;
        const body = await req.json();
        const { title, content, parentId } = body;

        if (!userId) {
          return new NextResponse("Unauthorized", { status: 401 });
        }

        const note = await prisma.note.update({
          where: {
            id: noteId,
            userId,
          },
          data: {
            ...(title !== undefined && { title }),
            ...(content !== undefined && { content }),
            ...(parentId !== undefined && { parentId: parentId ?? null }),
          },
        });
    
        return NextResponse.json(note);
      } catch (error) {
        console.error("[NOTES_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
      }
}
