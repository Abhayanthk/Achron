
"use client"
import { useTimer, SessionType } from "@/components/providers/timer-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, RefreshCw, ChevronLeft, BarChart3, Clock, Zap, Target, Plus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

// Mock Data for Analytics
const weeklyData = [
  { name: 'Mon', hours: 4.5 },
  { name: 'Tue', hours: 6.2 },
  { name: 'Wed', hours: 3.8 },
  { name: 'Thu', hours: 7.5 },
  { name: 'Fri', hours: 5.0 },
  { name: 'Sat', hours: 2.5 },
  { name: 'Sun', hours: 1.0 },
]

const monthlyData = [
    { name: 'Week 1', hours: 25 },
    { name: 'Week 2', hours: 32 },
    { name: 'Week 3', hours: 28 },
    { name: 'Week 4', hours: 35 },
]

const yearlyData = [
    { name: 'Jan', hours: 120 },
    { name: 'Feb', hours: 135 },
    { name: 'Mar', hours: 140 },
    { name: 'Apr', hours: 0 },
    { name: 'May', hours: 0 },
    { name: 'Jun', hours: 0 },
    { name: 'Jul', hours: 0 },
    { name: 'Aug', hours: 0 },
    { name: 'Sep', hours: 0 },
    { name: 'Oct', hours: 0 },
    { name: 'Nov', hours: 0 },
    { name: 'Dec', hours: 0 },
]

export default function TimerPage() {
    const { isActive, timeLeft, duration, sessionType, toggle, reset, formatTime, setSession, presets, addPreset, isLoadingPresets } = useTimer()
    const [viewMode, setViewMode] = useState<"timer" | "stats">("timer")
    const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const currentData = timeRange === "week" ? weeklyData : timeRange === "month" ? monthlyData : yearlyData

    return (
        <div className="flex flex-col h-full bg-black min-h-screen text-white p-6 md:p-12 relative overflow-hidden">
             {/* Background Ambience */}
             <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_50%)]" />
                 <div className={cn(
                    "absolute inset-0 transition-opacity duration-1000",
                    isActive ? "opacity-30" : "opacity-0"
                )}>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
                </div>
             </div>

             {/* Header */}
             <header className="relative z-10 flex items-center justify-between mb-12">
                <Link href="/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <ChevronLeft className="size-5" />
                    <span className="text-sm font-medium">Back to Dashboard</span>
                </Link>
                <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-full border border-white/5">
                    <button 
                        onClick={() => setViewMode("timer")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                            viewMode === "timer" ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white"
                        )}
                    >
                        Timer
                    </button>
                    <button 
                        onClick={() => setViewMode("stats")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                            viewMode === "stats" ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white"
                        )}
                    >
                        Analytics
                    </button>
                </div>
             </header>

            <main className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                    {viewMode === "timer" ? (
                        <motion.div 
                            key="timer-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full flex flex-col items-center"
                        >
                            {/* Session Tag */}
                            <div className="flex items-center gap-2 mb-8">
                                <span className="flex h-3 w-3 relative">
                                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isActive ? "bg-blue-400" : "hidden")}></span>
                                    <span className={cn("relative inline-flex rounded-full h-3 w-3", isActive ? "bg-blue-500" : "bg-zinc-700")}></span>
                                </span>
                                <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">{sessionType}</span>
                            </div>

                            {/* Main Timer */}
                            <div className="relative mb-12 group cursor-pointer" onClick={toggle}>
                                <div className="text-[120px] md:text-[200px] leading-none font-bold font-mono tracking-tighter tabular-nums select-none bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent transition-all group-hover:scale-105 duration-300">
                                    {formatTime(timeLeft)}
                                </div>
                                {/* Progress Ring/Bar could go here, keeping it minimal for now */}
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-6 mb-16">
                                <Button 
                                    size="lg"
                                    className={cn(
                                        "h-20 w-20 rounded-full text-xl transition-all shadow-[0_0_40px_rgba(0,0,0,0.5)]",
                                        isActive 
                                            ? "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-red-500/50" 
                                            : "bg-white text-black hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
                                    )}
                                    onClick={toggle}
                                >
                                    {isActive ? <Pause className="fill-current size-8" /> : <Play className="fill-current size-8 ml-1" />}
                                </Button>
                                <Button 
                                    variant="outline"
                                    size="icon"
                                    className="h-14 w-14 rounded-full border-zinc-800 bg-black/50 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-500 hover:text-white transition-all"
                                    onClick={reset}
                                >
                                    <RefreshCw className="size-5" />
                                </Button>
                            </div>

                            {/* Presets Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                                {isLoadingPresets ? (
                                    Array(4).fill(0).map((_, i) => (
                                        <div key={i} className="flex flex-col items-start p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 h-[88px] relative">
                                            <Skeleton className="h-4 w-24 mb-2 bg-zinc-800" />
                                            <Skeleton className="h-3 w-12 bg-zinc-800" />
                                            <Skeleton className="absolute top-4 right-4 h-2 w-2 rounded-full bg-zinc-800" />
                                        </div>
                                    ))
                                ) : (
                                    presets.map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => setSession(preset.duration, preset.type as SessionType)}
                                            className="group relative flex flex-col items-start p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all text-left"
                                        >
                                            <div className={`absolute top-4 right-4 h-2 w-2 rounded-full ${preset.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                                            <span className="text-sm font-bold text-zinc-300 group-hover:text-white mb-1">{preset.name}</span>
                                            <span className="text-xs text-zinc-500 font-mono">{Math.floor(preset.duration / 60)}m</span>
                                        </button>
                                    ))
                                )}
                                
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-zinc-800 bg-transparent hover:bg-zinc-900/30 hover:border-zinc-700 transition-all text-zinc-500 hover:text-zinc-300 h-[88px]">
                                            <Plus className="size-6 mb-2 opacity-50" />
                                            <span className="text-xs font-medium">Add Custom</span>
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                                        <DialogHeader>
                                            <DialogTitle>Create Custom Timer</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={(e) => {
                                            e.preventDefault()
                                            const formData = new FormData(e.currentTarget)
                                            const promise = addPreset({
                                                name: formData.get("name") as string,
                                                duration: parseInt(formData.get("duration") as string) * 60,
                                                type: formData.get("type") as string,
                                                color: formData.get("color") as string
                                            })

                                            toast.promise(promise, {
                                                loading: 'Creating timer...',
                                                success: () => {
                                                    setIsDialogOpen(false)
                                                    return 'Timer created'
                                                },
                                                error: 'Failed to create timer'
                                            })
                                        }} className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-zinc-400">Name</label>
                                                <Input name="name" placeholder="e.g. Deep Work Session" className="bg-zinc-900 border-zinc-800" required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-zinc-400">Duration (minutes)</label>
                                                <Input name="duration" type="number" placeholder="25" className="bg-zinc-900 border-zinc-800" required min="1" max="180" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-zinc-400">Type</label>
                                                <select name="type" className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20">
                                                    <option value="DEEP WORK">Deep Work</option>
                                                    <option value="FLOW">Flow</option>
                                                    <option value="CODING">Coding</option>
                                                    <option value="LEARNING">Learning</option>
                                                    <option value="WRITING">Writing</option>
                                                    <option value="CUSTOM">Custom</option>
                                                </select>
                                            </div>
                                             <div className="space-y-2">
                                                <label className="text-xs font-medium text-zinc-400">Color</label>
                                                <div className="flex gap-2">
                                                    {["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-rose-500", "bg-cyan-500"].map((color) => (
                                                        <label key={color} className="relative cursor-pointer group">
                                                            <input type="radio" name="color" value={color} className="peer sr-only" defaultChecked={color === "bg-blue-500"} />
                                                            <div className={`w-6 h-6 rounded-full ${color} opacity-50 peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-white peer-checked:ring-offset-2 peer-checked:ring-offset-zinc-950 transition-all hover:opacity-80`}></div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200">Create Preset</Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                        </motion.div>
                    ) : (
                        <motion.div 
                            key="stats-view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full flex flex-col gap-6"
                        >
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                                    <div className="flex items-center gap-3 text-zinc-400 mb-2">
                                        <Clock className="size-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Total Focus</span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">42.5h</p>
                                    <p className="text-xs text-emerald-500 mt-1">+12% vs last week</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                                    <div className="flex items-center gap-3 text-zinc-400 mb-2">
                                        <Zap className="size-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">8 Days</p>
                                    <p className="text-xs text-zinc-500 mt-1">Keep it up!</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                                    <div className="flex items-center gap-3 text-zinc-400 mb-2">
                                        <Target className="size-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Daily Goal</span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">4/6h</p>
                                    <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-3 overflow-hidden">
                                        <div className="h-full w-[66%] bg-blue-500 rounded-full" />
                                    </div>
                                </div>
                           </div>

                             {/* Chart */}
                            <div className="h-[400px] w-full p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Focus Distribution</h3>
                                    <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 rounded-lg p-0.5">
                                        {(['week', 'month', 'year'] as const).map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => setTimeRange(r)}
                                                className={cn(
                                                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                                                    timeRange === r ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
                                                )}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={currentData}>
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#52525b" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false}
                                        />
                                        <YAxis 
                                            stroke="#52525b" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}h`}
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                            cursor={{ fill: '#27272a' }}
                                        />
                                        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                                            {currentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.hours > (timeRange === 'year' ? 100 : 6) ? '#3b82f6' : '#27272a'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
