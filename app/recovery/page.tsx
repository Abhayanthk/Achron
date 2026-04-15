"use client";

import { RecoveryFlow } from "@/components/recovery/recovery-flow";
import { RecoveryHistory } from "@/components/recovery/recovery-history";

export default function RecoveryPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 md:py-16">
        <RecoveryFlow />
        <RecoveryHistory />
      </div>
    </div>
  );
}
