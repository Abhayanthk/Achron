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
      const AccountCreatedDate = await prisma.user.findUnique({
            where: {
                  id: userId
            },
            select: {
                  createdAt: true
            }
      })
      const accountCreatedDate = AccountCreatedDate?.createdAt
      const analysisResponse = await axios.post(process.env.IS_PRODUCTION ? "https://achron-ai-service-production.up.railway.app/analyze-day" : "http://localhost:8000/analyze-day", {
            dailyLog,
            tasks,
            focusSession,
            calendarEvents,
            xpLogs,
            accountCreatedDate
      })
      const rawData = analysisResponse.data

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const finalAnalysis = Object.keys(rawData).reduce((acc: any, key) => {
            const value = rawData[key];
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && 'date' in value[0]) {
                  acc[key] = value.filter((item: any) => new Date(item.date) >= thirtyDaysAgo);
            } else {
                  acc[key] = value;
            }
            return acc;
      }, {});

      return NextResponse.json(finalAnalysis)
      } catch (error: any) {
            console.error("Error analyzing day:", error)
            return NextResponse.json({error: error?.code || error?.message}, {status: 500})
      }
}