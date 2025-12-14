"use client"

import { Activity, ArrowUpRight, Book, Calendar, Flame, Layout, Plus, Settings } from "lucide-react"
import { BentoCard } from "./bento-card"
import { ActivityChart } from "./activity-chart"
import { NonNegotiables } from "./non-negotiables"
import { TaskList } from "./task-list"
import { ProjectCard } from "./project-card"
import { HabitsSession } from "./habits-session"
import { IdentityProgress } from "./identity-progress"
import { XPHeatmap } from "./xp-heatmap"
import { DailyWisdom } from "./daily-wisdom"
import { FocusTimer } from "./focus-timer"
import { WorkBalance } from "./work-balance"
import { Button } from "@/components/ui/button"
import Link from "next/link"


import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export function DashboardGrid() {
  const { data: analyticsData = [] } = useQuery({
    queryKey: ['analytics', 'week'],
    queryFn: async () => {
        const res = await axios.get('/api/analytics?range=week');
        return res.data.data;
    }
  });

  const totalFocusHours = analyticsData.reduce((acc: any, curr: any) => acc + curr.hours, 0);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 p-4 lg:gap-6 min-h-screen">
      
      {/* ROW 1: Identity (4) + Daily Wisdom (4) + Focus Timer (4) */}
      <div className="md:col-span-2 lg:col-span-4 h-full">
         <BentoCard 
            title="Identity Progression" 
            className="h-full"
            action={<Link href="#"><Button variant="ghost" size="icon" className="h-6 w-6"><ArrowUpRight className="size-4 text-zinc-500 hover:text-white" /></Button></Link>}
          >
            <IdentityProgress />
          </BentoCard>
      </div>

      <div className="md:col-span-2 lg:col-span-4 h-full">
         <DailyWisdom />
      </div>

      <div className="md:col-span-4 lg:col-span-4 h-full">
         <FocusTimer />
      </div>

      {/* ROW 2: XP Constellation (7) + Work Balance (5) */}
      <div className="md:col-span-4 lg:col-span-7 h-full min-h-[180px]">
         <XPHeatmap />
      </div>
      <div className="md:col-span-4 lg:col-span-5 h-full min-h-[180px]">
         <WorkBalance />
      </div>

      {/* ROW 3: Daily Log (4) + Non-Negotiables (4) + Habit Mastery (4) */}
      <BentoCard 
        title="Daily Log" 
        className="md:col-span-2 lg:col-span-4"
        action={<Link href="#"><Button variant="ghost" size="icon" className="h-6 w-6"><ArrowUpRight className="size-4 text-zinc-500 hover:text-white" /></Button></Link>}
      >
        <div className="flex flex-col items-center justify-center h-full min-h-[120px] py-6 text-center bg-white/5 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10 transition-colors group/diary gap-2">
            <Book className="size-6 text-zinc-400 group-hover/diary:text-white transition-colors" />
            <div>
                <h4 className="text-base font-medium text-white">New Entry</h4>
                <p className="text-[10px] text-zinc-500">Record your day</p>
            </div>
        </div>
      </BentoCard>

       <BentoCard 
        title="Non-Negotiables" 
        className="md:col-span-2 lg:col-span-4"
        action={<Settings className="size-4 text-zinc-600 hover:text-white cursor-pointer" />}
      >
        <NonNegotiables />
      </BentoCard>

      <BentoCard 
        title="Habit Mastery" 
        className="md:col-span-2 lg:col-span-4"
        action={<Link href="#"><Button variant="ghost" size="icon" className="h-6 w-6"><ArrowUpRight className="size-4 text-zinc-500 hover:text-white" /></Button></Link>}
      >
        <HabitsSession />
      </BentoCard>

      {/* ROW 4: Tasks (7) + Projects (5) */}
      <BentoCard 
        title="Tasks" 
        className="md:col-span-4 lg:col-span-7"
        action={<Link href="#"><Button variant="ghost" size="icon" className="h-6 w-6"><ArrowUpRight className="size-4 text-zinc-500 hover:text-white" /></Button></Link>}
      >
         <div className="flex flex-col sm:flex-row items-start gap-6 h-full">
            <div className="flex-1 w-full">
                <TaskList />
            </div>
            <div className="hidden sm:block w-px bg-white/10 self-stretch my-2"></div>
            <div className="w-full sm:w-auto flex flex-col gap-2 min-w-[120px]">
                <Button className="w-full justify-start text-xs h-8" variant="outline"> <Plus className="mr-2 size-3" /> Add Task</Button>
                <Button className="w-full justify-start text-xs h-8" variant="ghost"> <Calendar className="mr-2 size-3 text-zinc-500" /> Calendar</Button>
            </div>
         </div>
      </BentoCard>

      <BentoCard 
        title="Active Projects" 
        className="md:col-span-4 lg:col-span-5"
        action={<Link href="#"><Button variant="ghost" size="icon" className="h-6 w-6"><ArrowUpRight className="size-4 text-zinc-500 hover:text-white" /></Button></Link>}
       >
        <ProjectCard />
      </BentoCard>

      {/* ROW 5: Activity (8) + Reminders (4) */}
      <BentoCard 
        title="Activity" 
        className="md:col-span-4 lg:col-span-8 lg:row-span-2"
        action={<div className="flex gap-2"><div className="flex items-center gap-1 text-[10px] text-zinc-500"><div className="size-2 rounded-full bg-blue-500"></div>Focus Hours</div><div className="flex items-center gap-1 text-[10px] text-zinc-500"><div className="size-2 rounded-full bg-white/10"></div>Goal</div></div>}
      >
        <div className="flex flex-col h-full justify-between min-h-[200px]">
            <div className="flex items-end justify-between">
                <div>
                     <p className="text-3xl font-bold text-white mt-1">{totalFocusHours.toFixed(1)}h</p>
                     <p className="text-xs text-zinc-500">Focus time this week</p>
                </div>
            </div>
            <div className="flex-1 -mb-2">
                <ActivityChart />
            </div>
        </div>
      </BentoCard>

      <BentoCard title="Reminders" className="md:col-span-4 lg:col-span-4 lg:row-span-2">
        <div className="flex flex-col justify-center items-center h-full gap-3 py-6 opacity-60 hover:opacity-100 transition-opacity">
            <Layout className="size-8 text-zinc-700" />
            <p className="text-center text-xs text-zinc-500">Workspace clean</p>
            <Button variant="outline" size="sm" className="w-full max-w-[120px] text-xs h-7">Set Reminder</Button>
        </div>
      </BentoCard>
    </div>
  )
}
