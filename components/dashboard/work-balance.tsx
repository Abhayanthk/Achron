"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Minus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"

export function WorkBalance() {
  const queryClient = useQueryClient()

  const { data: balance = { workHours: 0, wasteHours: 15 } } = useQuery({
    queryKey: ['balance'],
    queryFn: async () => {
        const res = await axios.get('/api/stats/balance');
        return res.data;
    }
  });

  const updateWasteMutation = useMutation({
      mutationFn: async (delta: number) => {
          await axios.post('/api/stats/balance', { delta });
      },
      onSuccess: (_, delta) => {
          queryClient.invalidateQueries({ queryKey: ['balance'] });
          toast.success(delta > 0 ? "Added waste hour" : "Removed waste hour");
      },
      onError: () => {
          toast.error("Failed to update stats");
      }
  });

  const wasteHours = balance.wasteHours
  const workHours = balance.workHours

  const totalHours = wasteHours + workHours
  // Avoid division by zero
  const safeTotal = totalHours === 0 ? 1 : totalHours

  const wastePercent = (wasteHours / safeTotal) * 100
  const workPercent = (workHours / safeTotal) * 100

  return (
    <div className="h-full bg-black/40 border border-white/5 rounded-xl p-6 flex flex-col justify-between backdrop-blur-sm relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 p-24 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 p-24 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
            <div>
                 <h3 className="text-sm font-bold text-white tracking-tight">Time Balance</h3>
                 <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Daily Audit</p>
            </div>
            <div className="flex gap-4 text-xs font-mono">
                <div className="flex flex-col items-end">
                    <span className="text-red-400 font-bold">{wasteHours.toFixed(1)}h</span>
                    <span className="text-zinc-600 text-[9px] uppercase">Wasted</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex flex-col items-end">
                    <span className="text-blue-400 font-bold">{workHours.toFixed(1)}h</span>
                    <span className="text-zinc-600 text-[9px] uppercase">Work</span>
                </div>
            </div>
        </div>

        {/* The Bar Stack */}
        <div className="relative h-12 w-full flex rounded-lg overflow-hidden border border-white/5 bg-zinc-950/50">
            {/* Waste Bar */}
            <motion.div 
                className="h-full bg-linear-to-r from-red-950/50 to-red-900/40 relative flex items-center justify-center group"
                initial={{ width: 0 }}
                animate={{ width: `${wastePercent}%` }}
                transition={{ type: "spring", bounce: 0, duration: 0.8 }}
            >
                <div className="absolute inset-y-0 right-0 w-px bg-red-500/20" />
                {wastePercent > 10 && (
                    <span className="text-[10px] font-bold text-red-500/50 group-hover:text-red-400 transition-colors uppercase tracking-widest">
                        Waste
                    </span>
                )}
            </motion.div>

            {/* Work Bar */}
            <motion.div 
                className="h-full bg-linear-to-r from-blue-900/40 to-blue-800/50 relative flex items-center justify-center group"
                initial={{ width: 0 }}
                animate={{ width: `${workPercent}%` }}
                transition={{ type: "spring", bounce: 0, duration: 0.8 }}
            >
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.1)_50%,transparent_75%,transparent_100%)] bg-size-[250%_250%] animate-[shimmer_3s_infinite]" />
                 {workPercent > 10 && (
                    <span className="text-[10px] font-bold text-blue-400 group-hover:text-blue-300 transition-colors uppercase tracking-widest relative z-10">
                        Deep Work
                    </span>
                )}
            </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4 gap-4">
             <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <AlertCircle className="size-3 text-zinc-700" />
                <span>Honesty is key.</span>
             </div>

             <div className="flex gap-2">
                 <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] border-zinc-800 bg-black/50 hover:bg-zinc-900 hover:text-white"
                    onClick={() => updateWasteMutation.mutate(1)}
                    disabled={updateWasteMutation.isPending}
                 >
                    <Plus className="size-3 mr-1" /> Add Hour
                 </Button>
             </div>
        </div>
    </div>
  )
}
