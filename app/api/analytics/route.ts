import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to get start of current week (Monday)
function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "week";

    const now = new Date();
    let data: any[] = [];
    let queryStartDate = new Date();

    if (range === "week") {
        queryStartDate = getStartOfWeek(now);
        // Ensure we fetch data from Monday
        const sessions = await prisma.focusSession.findMany({
            where: {
                userId,
                endTime: { gte: queryStartDate },
                status: "COMPLETED"
            }
        });

        // Initialize empty week
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const weeklyMap = new Map();
        days.forEach(d => weeklyMap.set(d, 0));

        sessions.forEach(session => {
            if (session.endTime) {
                const dayIndex = session.endTime.getDay(); // 0 is Sunday
                // Convert 0(Sun) -> 6, 1(Mon) -> 0
                const mapIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                const dayName = days[mapIndex];
                const hours = (session.duration || 0) / 3600;
                weeklyMap.set(dayName, weeklyMap.get(dayName) + hours);
            }
        });

        data = Array.from(weeklyMap).map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(1)) }));

    } else if (range === "month") {
        // Last 4 weeks distribution? Or just days of month? 
        // User mock data showed "Week 1, Week 2..."
        // Let's do current month broken by weeks
        queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const sessions = await prisma.focusSession.findMany({
            where: {
                userId,
                endTime: { gte: queryStartDate },
                status: "COMPLETED"
            }
        });

        const weeklyMap = new Map();
        weeklyMap.set("Week 1", 0);
        weeklyMap.set("Week 2", 0);
        weeklyMap.set("Week 3", 0);
        weeklyMap.set("Week 4", 0);
        weeklyMap.set("Week 5", 0);

        sessions.forEach(session => {
             if (session.endTime) {
                 const date = session.endTime.getDate();
                 const weekNum = Math.ceil(date / 7);
                 const key = `Week ${weekNum}`;
                 if(weeklyMap.has(key)) {
                     const hours = (session.duration || 0) / 3600;
                     weeklyMap.set(key, weeklyMap.get(key) + hours);
                 }
             }
        });
        
        // Cleanup Week 5 if empty? No, ok to show 0.
        data = Array.from(weeklyMap).map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(1)) }));

    } else if (range === "year") {
        queryStartDate = new Date(now.getFullYear(), 0, 1);
        const sessions = await prisma.focusSession.findMany({
            where: {
                userId,
                endTime: { gte: queryStartDate },
                status: "COMPLETED"
            }
        });

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyMap = new Map();
        months.forEach(m => monthlyMap.set(m, 0));

        sessions.forEach(session => {
            if (session.endTime) {
                const monthName = months[session.endTime.getMonth()];
                const hours = (session.duration || 0) / 3600;
                monthlyMap.set(monthName, monthlyMap.get(monthName) + hours);
            }
        });

        data = Array.from(monthlyMap).map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(1)) }));
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
