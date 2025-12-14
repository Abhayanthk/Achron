import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // 1. Calculate Work Hours (from Focus Sessions today)
    const sessions = await prisma.focusSession.findMany({
        where: {
            userId,
            startTime: { gte: startOfDay, lt: endOfDay },
            status: "COMPLETED"
        }
    });

    const workSeconds = sessions.reduce((acc, session) => acc + (session.duration || 0), 0);
    const workHours = workSeconds / 3600;

    // 2. Fetch Waste Hours (from WorkLog today)
    let wasteLog = await prisma.workLog.findFirst({
        where: {
            userId,
            date: { gte: startOfDay, lt: endOfDay },
            type: "WASTE"
        }
    });

    // Default to 15 hours if no log exists for today
    if (!wasteLog) {
        wasteLog = await prisma.workLog.create({
            data: {
                userId,
                type: "WASTE",
                hours: 15,
                date: new Date() // Use current time for creation
            }
        });
    }

    const wasteHours = wasteLog.hours;

    return NextResponse.json({ 
        workHours: parseFloat(workHours.toFixed(2)), 
        wasteHours: parseFloat(wasteHours.toFixed(2)) 
    });

  } catch (error: any) {
    console.error("Error fetching balance stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
    
        if (!userId) {
          return new NextResponse("Unauthorized", { status: 401 });
        }

        const { delta } = await request.json(); // e.g., 1 or -1

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const wasteLog = await prisma.workLog.findFirst({
            where: {
                userId,
                date: { gte: startOfDay, lt: endOfDay },
                type: "WASTE"
            }
        });

        if (!wasteLog) {
             // Should verify first via GET usually, but safe to create if missing
             await prisma.workLog.create({
                data: {
                    userId,
                    type: "WASTE",
                    hours: 15 + delta,
                    date: new Date()
                }
            });
        } else {
            await prisma.workLog.update({
                where: { id: wasteLog.id },
                data: {
                    hours: { increment: delta }
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error updating waste stats:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
