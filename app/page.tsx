import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Particles from "@/components/Particles";

export default function Home() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <Particles
        // I used !absolute to override any conflicting styles from the component library
        className="absolute! inset-0! z-0!"
        particleColors={["#ffffff", "#ffffff"]}
        particleCount={900}
        particleSpread={15}
        speed={0.1}
        particleBaseSize={100}
        moveParticlesOnHover={true}
        alphaParticles={false}
        disableRotation={false}
      />
      {/* pointer-events-none is used to here to interact with the particles */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 pointer-events-none">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight text-center">
          Archon System
        </h1>
        <p className="text-zinc-400 mb-8 text-center max-w-md">
          Advanced operational dashboard. Monitor tasks, habits, and projects in
          the abyss.
        </p>
        {/* pointer-events-auto is used to interact with the button */}
        <div className="flex flex-row gap-4 pointer-events-auto">
          <SignedIn>
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-zinc-200 hover:scale-105 transition-all shadow-lg shadow-white/10 cursor-pointer"
              >
                Enter System
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-white border-white hover:bg-white/10 hover:scale-105 transition-all shadow-lg shadow-white/5 cursor-pointer"
              >
                Log In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-zinc-200 hover:scale-105 transition-all shadow-lg shadow-white/10 cursor-pointer"
              >
                Sign Up
              </Button>
            </Link>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
