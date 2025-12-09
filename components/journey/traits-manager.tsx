"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, ChevronRight, Target, Calendar } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Trait = {
    id: string
    name: string
    currentLevel: number
    maxLevel: number
    currentTitle: string
    nextTitle: string
    progress: number
    color: string
}

const initialTraits: Trait[] = [
    {
        id: "1",
        name: "Competitive Programmer",
        currentLevel: 42,
        maxLevel: 100,
        currentTitle: "Grandmaster",
        nextTitle: "Legendary Grandmaster",
        progress: 42,
        color: "bg-yellow-500"
    },
    {
        id: "2",
        name: "Discipline",
        currentLevel: 12,
        maxLevel: 100,
        currentTitle: "Monk Mode",
        nextTitle: "Stoic",
        progress: 12,
        color: "bg-red-500"
    }
]

export function TraitsManager() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Active Traits</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                    <Plus className="size-4" />
                    New Trait
                </button>
            </div>

            <div className="grid gap-4">
                {initialTraits.map((trait) => (
                    <TraitCard key={trait.id} trait={trait} />
                ))}
                
                {/* Empty State / Add New Placeholder */}
                <button className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 rounded-2xl" />
                    <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center mb-3 group-hover:bg-zinc-800 transition-colors">
                        <Plus className="size-6 text-zinc-500 group-hover:text-white" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500 group-hover:text-zinc-300">Create New Trait</p>
                </button>
            </div>
        </div>
    )
}

function TraitCard({ trait }: { trait: Trait }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 p-6 transition-all hover:border-white/20">
            <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">{trait.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-zinc-400">
                            Lvl {trait.currentLevel}
                        </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">{trait.currentTitle}</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button className="hidden group-hover:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white hover:bg-white/10 transition-all">
                         Level Up
                        <ChevronRight className="size-3" />
                    </button>
                    <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white">
                                <MoreHorizontal className="size-4" />
                            </button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10 text-zinc-300">
                             <DropdownMenuItem className="focus:bg-white/10 cursor-pointer">Edit Details</DropdownMenuItem>
                             <DropdownMenuItem className="focus:bg-white/10 cursor-pointer">Manage Milestones</DropdownMenuItem>
                             <DropdownMenuItem className="focus:bg-red-500/10 text-red-400 focus:text-red-400 cursor-pointer">Archive Trait</DropdownMenuItem>
                         </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Milestones Timeline Preview */}
            <div className="relative pt-6 pb-2">
                 <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                     <span>Current: {trait.currentTitle}</span>
                     <span>Next: {trait.nextTitle} (Lvl {trait.currentLevel + 5})</span>
                 </div>
                 <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden">
                     <div className={`h-full ${trait.color} w-[${trait.progress}%]`} style={{ width: `${trait.progress}%` }} />
                 </div>
            </div>
        </div>
    )
}
