import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const GET = async () =>{
      try {
            const {userId} = await auth()
            if (!userId) {
                  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const projects = await prisma.project.groupBy({
                  by: ['status'],
                  where: {
                        userId,
                  },
                  _count: {
                        status: true,
                  },
            })

            const stats = {
                  active: 0,
                  completed: 0,
                  paused: 0,
            }

            projects.forEach((project) => {
                  const status = project.status.toLowerCase()
                  if (status === 'active') stats.active = project._count.status
                  else if (status === 'completed') stats.completed = project._count.status
                  else if (status === 'paused' || status === 'archived') stats.paused += project._count.status
            })

            return NextResponse.json(stats)
      } catch (error: any) {
            console.error("Error fetching project stats:", error);
            return NextResponse.json({ error: error.message || error.code }, { status: 500 });
      }
}