import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest){
      try {
            const {userId} = await auth()

            if(!userId){
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
      }
      const dailyLog = await prisma.dailyLog.findMany({
            where: {
                  userId,
            }
      })
      const tasks = await prisma.task.findMany({
            where: {
                  userId,

            },
            include: {
                  category: true,
                  section: true
            }
      })
      const focusSession = await prisma.focusSession.findMany({
            where: {
                  userId,
                  status: "COMPLETED"
            },
            include: {
                  timer: true
            }
      })
      const calendarEvents = await prisma.calendarEvent.findMany({
            where: {
                  userId,
            },
            include: {
                  category: true
            }
      })
      const xpLogs = await prisma.xpLog.findMany({
            where: {
                  userId,
            }
      })
      const analysisResponse = await axios.post("http://localhost:8000/analyze-day", {
            dailyLog,
            tasks,
            focusSession,
            calendarEvents,
            xpLogs
      })

      return NextResponse.json(analysisResponse.data)
      } catch (error: any) {
            console.error("Error analyzing day:", error)
            return NextResponse.json({error: error?.code || error?.message}, {status: 500})
      }
}