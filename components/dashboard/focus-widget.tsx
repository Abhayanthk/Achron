"use client"

import { useState } from "react"
import { Check, Edit2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function FocusWidget() {
  const [focus, setFocus] = useState<string>("")
  const [isEditing, setIsEditing] = useState(true)

  const handleSave = () => {
    if (focus.trim()) setIsEditing(false)
  }

  return (
    <div className="h-full bg-zinc-950 border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
        
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-xs space-y-4">
            <div>
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    One Main Thing
                </h3>
                {isEditing ? (
                    <div className="flex gap-2">
                        <Input 
                            value={focus}
                            onChange={(e) => setFocus(e.target.value)}
                            placeholder="What must be done?"
                            className="bg-zinc-900 border-zinc-800 text-center text-lg font-medium placeholder:text-zinc-700"
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            autoFocus
                        />
                        <Button size="icon" variant="ghost" onClick={handleSave} className="shrink-0 hover:bg-zinc-800 hover:text-white">
                            <Check className="size-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="group/text relative cursor-pointer" onClick={() => setIsEditing(true)}>
                        <p className="text-2xl md:text-3xl font-bold text-white leading-tight wrap-break-word">
                            {focus}
                        </p>
                        <Edit2 className="absolute -right-6 top-1/2 -translate-y-1/2 size-4 text-zinc-700 opacity-0 group-hover/text:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>
            
            {!isEditing && (
                 <p className="text-[10px] text-zinc-600 uppercase tracking-wide">
                    Only move on when this is done.
                 </p>
            )}
        </div>
    </div>
  )
}
