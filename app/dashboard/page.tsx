import PixelBlast from '@/components/PixelBlast'
import { DashboardGrid } from '@/components/dashboard/dashboard-grid'
import React from 'react'

export default function DashboardPage() {
  return (
    <div className="relative w-full h-full min-h-screen bg-black">
      <div className="fixed top-0 left-0 w-full h-full z-0">
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
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        <DashboardGrid />
      </div>
    </div>
  )
}
