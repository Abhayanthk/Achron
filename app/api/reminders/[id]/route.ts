import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params

    if (!id) {
        return new NextResponse("Reminder ID is required", { status: 400 })
    }

    const reminder = await prisma.reminder.deleteMany({
      where: {
        id,
        userId,
      },
    })

    return NextResponse.json(reminder)
  } catch (error) {
    console.error("[REMINDER_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
