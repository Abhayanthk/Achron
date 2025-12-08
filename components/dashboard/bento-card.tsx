"use client"
import React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface BentoCardProps {
  title?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
  colSpan?: number
  rowSpan?: number
}

export function BentoCard({ 
  title, 
  children, 
  className, 
  action, 
  colSpan = 1,
  rowSpan = 1
}: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-sm transition-all hover:bg-black/50 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
        // Responsive grid spans
        colSpan === 2 && "md:col-span-2",
        colSpan === 3 && "md:col-span-3",
        rowSpan === 2 && "md:row-span-2",
        className
      )}
    >
        {/* Glow effect on hover */}
      <div className="absolute -inset-px -z-10 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className="flex items-center justify-between mb-4">
        {title && (
          <h3 className="text-sm font-medium text-zinc-400 tracking-wider uppercase">
            {title}
          </h3>
        )}
        {action && <div>{action}</div>}
      </div>
      
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  )
}
