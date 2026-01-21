import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest){
      const {userId} = await auth()

      if(!userId){
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dailyLog = await prisma.dailyLog.findMany({
            where: {
                  userId,
                  date: {
                        gte: today,
                        lt: tomorrow
                  }
            }
      })
      const analysisResponse = await axios.post("http://localhost:8000/analyze-day", {
            dailyLog
      })

      return NextResponse.json(analysisResponse.data)
}