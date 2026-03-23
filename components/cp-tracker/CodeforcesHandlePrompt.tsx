"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trophy, Loader2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface CodeforcesHandlePromptProps {
  currentHandle: string | null;
}

export function CodeforcesHandlePrompt({
  currentHandle,
}: CodeforcesHandlePromptProps) {
  const [handle, setHandle] = useState(currentHandle || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      setError("Please enter your Codeforces handle");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/codeforces-handle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error || "Could not verify handle. Please check and try again.",
        );
        setLoading(false);
        return;
      }

      // Refresh the page to load rating data with the new handle
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-zinc-900/50 rounded-xl border border-white/5 overflow-hidden">
      <div className="p-6 flex flex-col items-center text-center space-y-4">
        {/* Icon */}
        <div className="h-14 w-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Trophy className="h-7 w-7 text-indigo-400" />
        </div>

        {/* Text */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">
            Connect Your Codeforces Profile
          </h3>
          <p className="text-zinc-400 text-sm max-w-md">
            Enter your Codeforces handle to track your rating history and
            contest performance.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2"
        >
          <Input
            value={handle}
            onChange={(e) => {
              setHandle(e.target.value);
              setError(null);
            }}
            placeholder="e.g. tourist"
            className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 flex-1"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !handle.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Save Handle"
            )}
          </Button>
        </form>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {/* Help link */}
        <a
          href="https://codeforces.com/register"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-400 text-xs flex items-center gap-1 transition-colors"
        >
          Don&apos;t have an account? Register on Codeforces
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
