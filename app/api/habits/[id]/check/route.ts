import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { differenceInCalendarDays, isSameDay } from "date-fns";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    let body = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Body is not JSON or empty
    }
    
    const { date } = body as { date?: string }; // Optional date, default to now

    const checkDate = date ? new Date(date) : new Date();

    // Fetch habit
    const habit = await prisma.habit.findUnique({
      where: { id, userId },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    // Check if already completed on this date
    const completedDates = habit.completedDates.map((d) => new Date(d));
    const isCompleted = completedDates.some((d) => isSameDay(d, checkDate));

    if (isCompleted) {
        // UNCHECK logic
        // Allow unchecking, remove date, decrement streak, remove XP?
        // Simplification: Just remove date. Recalculating streak perfectly is hard without history.
        // But assuming streak is just consecutive count ending today.
        // If unchecking today, streak--
        // For XP, we should decrement user XP.
        
        // Remove date
        const newDates = completedDates.filter((d) => !isSameDay(d, checkDate));
        
        let newStreak = Math.max(0, habit.streak - 1);

        await prisma.$transaction([
            prisma.habit.update({
                where: { id },
                data: {
                    completedDates: newDates,
                    streak: newStreak
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { xp: { decrement: 50 } }
            }),
            // Ideally remove XpLog too, but we might not find the exact one easily without ID.
            // We'll create a negative log or just leave it for now to avoid complexity.
            // Let's create a negative Log to balance it.
            prisma.xpLog.create({
                data: {
                    userId,
                    amount: -50,
                    source: "HABIT_UNDO",
                    description: `Undid habit: ${habit.name}`
                }
            })
        ]);

        return NextResponse.json({ ...habit, completedDates: newDates, streak: newStreak });

    } else {
        // CHECK logic
        
        // 1. Calculate Penalty first (ensure streak is accurate up to yesterday)
        let currentStreak = habit.streak;
        const sortedDates = completedDates.sort((a, b) => b.getTime() - a.getTime());
        const lastCompletedDate = sortedDates[0];

        if (lastCompletedDate) {
             const daysSinceLast = differenceInCalendarDays(checkDate, lastCompletedDate);
             if (daysSinceLast > 1) {
                 const missedDays = daysSinceLast - 1;
                 const penalty = Math.pow(2, missedDays - 1);
                 currentStreak = Math.max(0, currentStreak - penalty);
             }
        }

        // 2. Add today
        const newDates = [...completedDates, checkDate];
        const newStreak = currentStreak + 1;

        await prisma.$transaction([
             prisma.habit.update({
                 where: { id },
                 data: {
                     completedDates: newDates,
                     streak: newStreak
                 }
             }),
             prisma.user.update({
                 where: { id: userId },
                 data: { xp: { increment: 50 } }
             }),
             prisma.xpLog.create({
                 data: {
                     userId,
                     amount: 50,
                     source: "HABIT_COMPLETION",
                     description: `Completed habit: ${habit.name}`
                 }
             })
        ]);
        
        return NextResponse.json({ ...habit, completedDates: newDates, streak: newStreak });
    }

  } catch (error) {
    console.error("[HABIT_CHECK]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
