import PixelBlast from '@/components/PixelBlast'
import { JourneyHeader } from '@/components/journey/journey-header'
import { XPHistory } from '@/components/journey/xp-history'
import { TraitsManager } from '@/components/journey/traits-manager'

export default function JourneyPage() {
  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col">
       {/* Background Effect */}
      <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
        <PixelBlast
          variant="circle"
          pixelSize={3}
          color="#1a1a2e"
          patternScale={6}
          patternDensity={1.2}
          speed={0.2}
          transparent
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto p-6 space-y-8">
        <header className="flex flex-col gap-2 mb-8">
            <h1 className="text-4xl font-bold text-white tracking-tight">My Journey</h1>
            <p className="text-zinc-400">Track your evolution, define your path, and master your traits.</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Profile & XP History */}
            <div className="space-y-6 lg:col-span-1">
                <JourneyHeader />
                <XPHistory />
            </div>

            {/* Right Column: Traits System */}
            <div className="lg:col-span-2">
                <TraitsManager />
            </div>
        </div>
      </div>
    </div>
  )
}
