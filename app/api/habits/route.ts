import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { differenceInCalendarDays } from "date-fns";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const showArchived = searchParams.get("archived") === "true";

    const habits = await prisma.habit.findMany({
      where: {
        userId,
        archived: showArchived ? undefined : false,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    // Lazy update for penalties
    const today = new Date();
    const updatedHabits = await Promise.all(
      habits.map(async (habit) => {
        let newStreak = habit.streak;
        let needsUpdate = false;

        // Find the latest completion date
        // completedDates are stored as DateTime arrays. ensure sorted.
        const sortedDates = habit.completedDates.sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );
        const lastCompletedDate = sortedDates[0] ? new Date(sortedDates[0]) : null;

        if (lastCompletedDate && newStreak > 0) {
          const daysSinceLast = differenceInCalendarDays(today, lastCompletedDate);
          // If daysSinceLast <= 1 (0 = today, 1 = yesterday), safe.
          // If > 1, missed days exist.
          if (daysSinceLast > 1) {
            const missedDays = daysSinceLast - 1;
            const penalty = Math.pow(2, missedDays - 1);
            newStreak = Math.max(0, habit.streak - penalty);
            if (newStreak !== habit.streak) {
              needsUpdate = true;
            }
          }
        }

        if (needsUpdate && lastCompletedDate) {
            // Adding the missed days' dates (day after last completion through yesterday)
            // This make sure that the penalty won't be fasly applied again
            
            const missedDayDates: Date[] = [];
            const daysSinceLast = differenceInCalendarDays(today, lastCompletedDate);
            for (let i = 1; i < daysSinceLast; i++) {
              const missedDate = new Date(lastCompletedDate);
              missedDate.setDate(missedDate.getDate() + i);
              missedDayDates.push(missedDate);
            }

            await prisma.habit.update({
                where: { id: habit.id },
                data: { streak: newStreak,
                  completedDates: {
                        push: missedDayDates
                  }
                 }
            });
            return { ...habit, streak: newStreak };
        }

        return habit;
      })
    );

    return NextResponse.json(updatedHabits);
  } catch (error) {
    console.error("[HABITS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, targetDays } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const habit = await prisma.habit.create({
      data: {
        userId,
        name,
        targetDays: targetDays ? parseInt(targetDays) : null,
      },
    });

    return NextResponse.json(habit);
  } catch (error) {
    console.error("[HABITS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
