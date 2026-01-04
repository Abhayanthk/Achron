
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"

export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const nonNegotiables = await prisma.nonNegotiable.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "asc", 
      },
    })

    return NextResponse.json(nonNegotiables)
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
        const { title } = body;

        if (!title) {
            return new NextResponse("Title is required", { status: 400 });
        }

        const nonNegotiable = await prisma.nonNegotiable.create({
            data: {
                title,
                userId,
                completedDates: [] // Initialize with empty array
            },
        });

        return NextResponse.json(nonNegotiable);

    } catch (error) {
         console.error('[NON_NEGOTIABLES_POST]', error);
         return new NextResponse("Internal Error", { status: 500 });
    }
}
