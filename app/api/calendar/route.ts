import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { addWeeks, addMonths, isBefore, startOfDay } from "date-fns";
import axios from "axios";

// Helper to expand recurring events
const expandRecurringEvents = (events: any[], startDate: Date, endDate: Date) => {
  const expandedEvents: any[] = [];
  events.forEach((event) => {
    if (!event.recurrence || event.recurrence === "NONE") {
      if (
        ( event.start <= endDate) ||
        (event.end >= startDate )
      ) {
        expandedEvents.push(event);
      }
      return;
    }
    let currentStart = new Date(event.start);
    let currentEnd = new Date(event.end);
    const duration = currentEnd.getTime() - currentStart.getTime();

    while (isBefore(currentStart, endDate) || currentStart.getTime() === endDate.getTime()) {
      if (currentEnd > startDate && currentStart <= endDate) {
        expandedEvents.push({
          ...event,
          id: `${event.id}-${currentStart.toISOString()}`,
          originalId: event.id, // Keep trace of original
          start: new Date(currentStart),
          end: new Date(currentEnd),
        });
      }

      // meaningful logic for next iteration
      if (event.recurrence === "WEEKLY") {
        currentStart = addWeeks(currentStart, 1);
        currentEnd = new Date(currentStart.getTime() + duration);
      } else if (event.recurrence === "MONTHLY") {
        currentStart = addMonths(currentStart, 1);
        currentEnd = new Date(currentStart.getTime() + duration);
      } else {
        break; // Should not happen
      }
    }
  });

  return expandedEvents;
};

// Fetching all events
export const GET = async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  if (!startDateParam || !endDateParam) {
    return NextResponse.json(
      { error: "Missing startDate or endDate" },
      { status: 400 }
    );
  }

  const startDate = new Date(startDateParam);
  const endDate = new Date(endDateParam);


  let events = await prisma.calendarEvent.findMany({
    where: {
      userId,
      OR: [
        {
          // Standard events in range
          recurrence: "NONE",
          start: { lte: endDate },
          end: { gte: startDate },
        },
        {
          recurrence: { not: "NONE" },
          start: { lte: endDate },
        },
      ],
    },
  });
  const cfContestList = await axios.get("https://codeforces.com/api/contest.list");
  if(cfContestList.data.status === "OK") {
    const contests = cfContestList.data.result;
    const cfEvents = contests
      .filter((contest: any) => contest.phase === "BEFORE" || contest.phase === "CODING")
      .map((contest: any) => {
        const startTime = contest.startTimeSeconds * 1000;
        const endTime = startTime + (contest.durationSeconds * 1000);
        
        return {
          id: `cf-${contest.id}`,
          title: contest.name,
          start: new Date(startTime),
          end: new Date(endTime),
          color: "#f6523b",
          allDay: false,
          recurrence: "NONE",
          isCompleted: false,
        };
    });
    // Use type assertion or spread into a new array typed as any[] to avoid conflicts
    events = [...events, ...cfEvents] as any[];
  }

  const expanded = expandRecurringEvents(events, startDate, endDate);

  return NextResponse.json(expanded);
};

// Creating an event
export const POST = async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const {
    title,
    startTime,
    endTime,
    categoryId,
    allDay = false,
    color = "#3b82f6",
    recurrence = "NONE",
    isCompleted = false,
  } = await request.json();
  const event = await prisma.calendarEvent.create({
    data: {
      userId,
      title,
      start: startTime,
      end: endTime,
      categoryId,
      allDay,
      color,
      recurrence,
      isCompleted,
    },
  });
  return NextResponse.json(event);
};

// updating an event
export const PUT = async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const {
    id,
    title,
    startTime,
    endTime,
    categoryId,
    allDay = false,
    color = "#3b82f6",
    recurrence = "NONE",
    isCompleted = false,
  } = await request.json();

  const event = await prisma.calendarEvent.update({
    where: {
      id,
      userId,
    },
    data: {
      title,
      start: startTime,
      end: endTime,
      categoryId,
      allDay,
      color,
      recurrence,
      isCompleted,
    },
  });
  return NextResponse.json(event);
};

// deleting an event
export const DELETE = async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await request.json();
  const event = await prisma.calendarEvent.delete({
    where: {
      id,
      userId,
    },
  });
  return NextResponse.json(event);
};