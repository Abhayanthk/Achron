import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"

export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(reminders)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { content } = body;

        if (!content) {
            return new NextResponse("Content is required", { status: 400 });
        }

        const reminder = await prisma.reminder.create({
            data: {
                content,
                userId,
            },
        });

        return NextResponse.json(reminder);

    } catch (error) {
         console.error('[REMINDERS_POST]', error);
         return new NextResponse("Internal Error", { status: 500 });
    }
}
