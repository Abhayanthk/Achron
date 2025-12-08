import PixelBlast from '@/components/PixelBlast'
import React from 'react'



import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full z-0">
      <PixelBlast
      variant="circle"
      pixelSize={4}
      color="#1a1a2e"
      patternScale={6}
      patternDensity={1.5}
      pixelSizeJitter={0.6}
      enableRipples
      rippleSpeed={0.3}
      rippleThickness={0.1}
      rippleIntensityScale={1.2}
      liquidStrength={0.15}
      liquidRadius={1.0}
      liquidWobbleSpeed={4}
      speed={0.4}
      edgeFade={0.3}
      transparent
      />
      </div>

      <div className="relative z-10 w-full h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Archon System</h1>
        <p className="text-zinc-400 mb-8 text-center max-w-md">
            Advanced operational dashboard. Monitor tasks, habits, and projects in the abyss.
        </p>
        <Link href="/dashboard">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200 hover:scale-105 transition-all shadow-lg shadow-white/10">
                Enter System
            </Button>
        </Link>
      </div>
    </div>
  )
}
