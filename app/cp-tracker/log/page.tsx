import React from "react";
import { LoggerForm } from "@/components/cp-tracker/LoggerForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoggerPage() {
  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center gap-4">
        <Link href="/cp-tracker">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white">Deep-Dive Logger</h1>
          <p className="text-zinc-400 text-sm">
            Diagnose your solve. Be honest, be detailed.
          </p>
        </div>
      </div>

      <div className="flex-1">
        <LoggerForm />
      </div>
    </div>
  );
}
