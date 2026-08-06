import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { today } from "@/lib/daily-log/date";
import { rollingConsistency } from "@/lib/daily-log/domain";
import { getCardSummaries } from "@/lib/daily-log/repository";

// Helper to get start of current week (Monday)
function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
//     js starts the week with sunday(0) but we want monday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
//     setHours(hours = 0, minutes = 0, seconds = 0, milliseconds = 0) the very start of the day
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
    const type = searchParams.get("type") || "focus"; // focus, logs, tasks, xp
    const startDate = searchParams.get("startDate");
    const now = startDate ? new Date(startDate) : new Date();
    let data: any[] = [];
    let queryStartDate = new Date();
    let queryEndDate = new Date();

    // Helper to setup date range
    if (range === "week") {
        queryStartDate = getStartOfWeek(now);
        queryEndDate = new Date(queryStartDate);
        queryEndDate.setDate(queryEndDate.getDate() + 7);
    } else if (range === "month") {
         queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
         queryEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else if (range === "year") {
        queryStartDate = new Date(now.getFullYear(), 0, 1);
        queryEndDate = new Date(now.getFullYear() + 1, 0, 1);
    } else if (range === "heatmap") {
         queryStartDate = new Date();
         queryStartDate.setDate(queryStartDate.getDate() - 365);
         queryEndDate = new Date(); // Heatmap usually goes up to today
         queryEndDate.setDate(queryEndDate.getDate() + 1);
    }

    if (type === "logs") {
        // Daily Logs Analytics
        const logs = await prisma.dailyLog.findMany({
            where: {
                userId,
                date: { gte: queryStartDate, lt: queryEndDate }
            },
            select: { date: true }
        });

        if (range === "week") {
             const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
             const map = new Map(days.map(d => [d, 0]));
             
             logs.forEach(log => {
                 const d = new Date(log.date);
                 const dayIndex = d.getDay();
                 const mapIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                 const dayName = days[mapIndex];
                 map.set(dayName, (map.get(dayName) || 0) + 1);
             });
             data = Array.from(map).map(([name, value]) => ({ name, value }));

        } else if (range === "month") {
             // Group by weeks
             const map = new Map<string, number>();
             // Initialize weeks
             for(let i=1; i<=5; i++) map.set(`Week ${i}`, 0);

             logs.forEach(log => {
                 const d = new Date(log.date);
                 const dateNum = d.getDate();
                 const weekNum = Math.ceil(dateNum / 7);
                 const key = `Week ${weekNum}`;
                 if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
             });
             data = Array.from(map).map(([name, value]) => ({ name, value }));

        } else if (range === "year") {
             const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
             const map = new Map(months.map(m => [m, 0]));
             
             logs.forEach(log => {
                 const d = new Date(log.date);
                 const monthName = months[d.getMonth()];
                 map.set(monthName, (map.get(monthName) || 0) + 1);
             });
             data = Array.from(map).map(([name, value]) => ({ name, value }));
        }

    } else if (type === "tasks") {
        const tasks = await prisma.task.findMany({
            where: {
                userId,
                OR: [
                    { createdAt: { gte: queryStartDate, lt: queryEndDate } },
                    { 
                        AND: [
                            { isCompleted: true }, 
                            { updatedAt: { gte: queryStartDate, lt: queryEndDate } } 
                        ]
                    }
                ]
            },
            select: { createdAt: true, updatedAt: true, isCompleted: true }
        });

        const processTasks = (periodMap: Map<string, { created: number, completed: number }>, getPeriod: (d: Date) => string) => {
            tasks.forEach(task => {
                // Count Created
                if (task.createdAt >= queryStartDate && task.createdAt < queryEndDate) {
                    const p = getPeriod(new Date(task.createdAt));
                    if (periodMap.has(p)) {
                        periodMap.get(p)!.created++;
                    }
                }
                // Count Completed
                if (task.isCompleted && task.updatedAt >= queryStartDate && task.updatedAt < queryEndDate) {
                    const p = getPeriod(new Date(task.updatedAt));
                    if (periodMap.has(p)) {
                        periodMap.get(p)!.completed++;
                    }
                }
            });
        };

        if (range === "week") {
            const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const map = new Map(days.map(d => [d, { created: 0, completed: 0 }]));
            
            processTasks(map, (d) => {
                const dayIndex = d.getDay();
                return days[dayIndex === 0 ? 6 : dayIndex - 1];
            });
            data = Array.from(map).map(([name, val]) => ({ name, ...val }));

        } else if (range === "month") {
            const map = new Map<string, { created: number, completed: number }>();
            for(let i=1; i<=5; i++) map.set(`Week ${i}`, { created: 0, completed: 0 });

            processTasks(map, (d) => `Week ${Math.ceil(d.getDate() / 7)}`);
            data = Array.from(map).map(([name, val]) => ({ name, ...val }));

        } else if (range === "year") {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const map = new Map(months.map(m => [m, { created: 0, completed: 0 }]));

            processTasks(map, (d) => months[d.getMonth()]);
            data = Array.from(map).map(([name, val]) => ({ name, ...val }));
        }

    } else if (type === "identity_stats") {
        // Identity Progress Stats
        const logsCount = await prisma.dailyLog.count({ where: { userId } });
        const tasksCount = await prisma.task.count({ where: { userId, isCompleted: true } });
        
        // Sum focus duration
        const focusSessionAgg = await prisma.focusSession.aggregate({
            where: { userId, status: "COMPLETED" },
            _sum: { duration: true }
        });
        const deepHours = (focusSessionAgg._sum.duration || 0) / 3600;

        const projectsCompleted = await prisma.project.count({ where: { userId, status: "COMPLETED" } }); // Assuming Project model status
        // If Project status is separate model, adjustment needed. Assuming 'status' field on Project based on prior context.
        // Actually, Project schema likely needs verifying but using safe assumption or count.
        // Let's assume Project has status. If not, we might need another check.
        // Re-checking previous context: ProjectCard component uses status.
        
        const habitsActive = await prisma.habit.count({ 
             where: { 
                 userId, 
                 archived: false // Assuming active habits are non-archived
             } 
        });

        // Rolling consistency from the Daily Evidence Log. Replaces the old
        // non-negotiable points score, which could go down as a penalty.
        const summaries = await getCardSummaries(userId);
        const consistency = rollingConsistency(
            summaries.map(s => s.date),
            today()
        );

        return NextResponse.json({
            likes: 0, // Deprecated/Removed from UI but keeping for type safety in frontend if needed temporary
            logsCount,
            tasksCount,
            deepHours,
            daysLogged: consistency.daysLogged,
            daysLoggedWindow: consistency.windowDays,
            projectsCompleted,
            habitsActive
        });

    } else if (type === "xp") {
        if (range === "heatmap") {
            // Full Heatmap logic (XP based) - Daily XP map for the last year
             const logs = await prisma.xpLog.findMany({
                where: {
                    userId,
                    createdAt: { gte: queryStartDate }
                },
                select: {
                    amount: true,
                    createdAt: true
                }
            });
    
            const dailyMap = new Map<string, number>();
            logs.forEach(log => {
                const dateStr = log.createdAt.toISOString().split('T')[0];
                const current = dailyMap.get(dateStr) || 0;
                dailyMap.set(dateStr, current + log.amount);
            });
            
            data = Array.from(dailyMap).map(([date, amount]) => ({ date, amount }));
        }else if (range === "all"){
            // Full XP Line Graph Logic (All Time)
            const logs = await prisma.xpLog.findMany({
                where: {
                    userId
                },
                orderBy: { createdAt: 'asc' }
            });
            data = logs.map(log => ({ date: log.createdAt.toISOString().split('T')[0], amount: log.amount }));
        } 
        else {
             // XP Line Graph Logic (Week, Month, Year)
             const logs = await prisma.xpLog.findMany({
                where: {
                    userId,
                    createdAt: { gte: queryStartDate, lt: queryEndDate }
                },
                orderBy: { createdAt: 'asc' }
            });

            if (range === "week") {
                // Group by Day (Mon-Sun)
                const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                // using a map to easily group in pairs and to access the dayName in O(1) TC
                const map = new Map(days.map(d => [d, 0]));
                logs.forEach(log => {
                    const d = new Date(log.createdAt);
                    const dayIndex = d.getDay();
                    const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];
                    map.set(dayName, (map.get(dayName) || 0) + log.amount);
                });
                data = Array.from(map).map(([name, amount]) => ({ date: name, amount }));

            } else if (range === "month") {
                // Group by Week
                const map = new Map<string, number>();
                for(let i=1; i<=5; i++) map.set(`Week ${i}`, 0);

                logs.forEach(log => {
                    const d = new Date(log.createdAt);
                    const weekNum = Math.ceil(d.getDate() / 7);
                    const key = `Week ${weekNum}`;
                    if(map.has(key)) map.set(key, (map.get(key) || 0) + log.amount);
                });
                 data = Array.from(map).map(([name, amount]) => ({ date: name, amount }));

            } else if (range === "year") {
                 // Group by Month
                 const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                 const map = new Map(months.map(m => [m, 0]));
                 logs.forEach(log => {
                     const d = new Date(log.createdAt);
                     const monthName = months[d.getMonth()];
                     map.set(monthName, (map.get(monthName) || 0) + log.amount);
                 });
                 data = Array.from(map).map(([name, amount]) => ({ date: name, amount }));
            }
        }
    } else if (type == "timer"){
       // FOCUS (Default Timer Analytics)
        const sessions = await prisma.focusSession.findMany({
            where: {
                userId,
                endTime: { gte: queryStartDate, lt: queryEndDate },
                status: "COMPLETED"
            }
        });

        if (range === "week") {
            const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const map = new Map(days.map(d => [d, 0]));
            
            sessions.forEach(session => {
                if (session.endTime) {
                    const dayIndex = session.endTime.getDay();
                    const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];
                    const hours = (session.duration || 0) / 3600;
                    map.set(dayName, (map.get(dayName) || 0) + hours);
                }
            });
            data = Array.from(map).map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(1)) }));

        } else if (range === "month") {
            const map = new Map<string, number>();
            for(let i=1; i<=5; i++) map.set(`Week ${i}`, 0);

            sessions.forEach(session => {
                if(session.endTime) {
                    const weekNum = Math.ceil(session.endTime.getDate() / 7);
                    const key = `Week ${weekNum}`;
                    if(map.has(key)) {
                         const hours = (session.duration || 0) / 3600;
                         map.set(key, (map.get(key) || 0) + hours);
                    }
                }
            });
            data = Array.from(map).map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(1)) }));

        } else if (range === "year") {
             const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
             const map = new Map(months.map(m => [m, 0]));

             sessions.forEach(session => {
                 if(session.endTime) {
                     const monthName = months[session.endTime.getMonth()];
                     const hours = (session.duration || 0) / 3600;
                     map.set(monthName, (map.get(monthName) || 0) + hours);
                 }
             });
             data = Array.from(map).map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(1)) }));
        }
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
