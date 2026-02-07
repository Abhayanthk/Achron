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
        const newDates = [...completedDates, checkDate];
        const newStreak = habit.streak + 1;

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
