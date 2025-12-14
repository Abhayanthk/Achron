
// get all the timers for the user

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const [timers, user] = await Promise.all([
            prisma.timer.findMany({
                where: { userId },
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { alarmSound: true }
            })
        ]);

        return NextResponse.json({ 
            timers, 
            alarmSound: user?.alarmSound || "digital" 
        });
    } catch (error: any) {
        console.error("Error fetching timers:", error);
        return NextResponse.json({ error: error.code || error.message }, { status: 500 });
    }
}
