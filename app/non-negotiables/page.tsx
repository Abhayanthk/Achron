"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ConfidenceMountain } from "@/components/non-negotiable/confidence-mountain";
import { PremiumTaskCard } from "@/components/non-negotiable/premium-task-card";
import { motion } from "framer-motion";

export interface NonNegotiable {
  id: string;
  title: string;
  completedDates: string[];
  createdAt: string;
}

export default function NonNegotiablesPage() {
  const [newItem, setNewItem] = useState("");
  const queryClient = useQueryClient();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["non-negotiables"],
    queryFn: async () => {
      const res = await axios.get("/api/non-negotiables");
      return res.data as NonNegotiable[];
    },
  });

  const { mutate: createMutation, isPending: isCreating } = useMutation({
    mutationFn: async (title: string) => {
      return axios.post("/api/non-negotiables", { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["non-negotiables"] });
      setNewItem("");
      toast.success("Added to your daily protocol");
    },
  });

  const { mutate: toggleMutation, isPending: isToggling } = useMutation({
    mutationFn: async ({ id, date }: { id: string; date: Date }) => {
      return axios.put(`/api/non-negotiables/${id}`, {
        action: "toggle",
        date: date.toISOString(),
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["non-negotiables"] });

      // Celebration logic
      const today = new Date();
      const isToday = variables.date.toDateString() === today.toDateString();

      if (isToday) {
        const updatedItem = data.data;
        const isNowDone = updatedItem.completedDates.some(
          (d: string) => new Date(d).toDateString() === today.toDateString()
        );

        // If we just completed it, show a motivational toast
        if (isNowDone) {
          // Check if this was the LAST one
          const otherItems = items.filter(
            (i: NonNegotiable) => i.id !== variables.id
          );
          const allOthersDone = otherItems.every((i: NonNegotiable) =>
            i.completedDates.some(
              (d: string) => new Date(d).toDateString() === today.toDateString()
            )
          );

          if (allOthersDone && otherItems.length > 0) {
            toast("🔥 PROTOCOL COMPLETE", {
              description: "You have conquered the day. Momentum is building.",
              className:
                "bg-emerald-500 border-emerald-600 text-white font-bold",
              duration: 5000,
            });
          } else {
            toast.success("Momentum +1", {
              description: "Keep pushing.",
            });
          }
        }
      }
    },
    onSettled: () => {
      setTogglingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.delete(`/api/non-negotiables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["non-negotiables"] });
      toast.success("Protocol removed");
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    createMutation(newItem);
  };

  const isCompletedToday = (item: NonNegotiable) => {
    const today = new Date().toDateString();
    return item.completedDates.some(
      (d) => new Date(d).toDateString() === today
    );
  };

  const today = new Date();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">
      {/* Nav */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">Non-Negotiables</h1>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-12">
        {/* HERO: Mountain of Confidence */}
        <section>
          <ConfidenceMountain items={items} />
        </section>

        {/* INPUT SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Daily Protocol</h2>
            <span className="text-zinc-500 text-sm font-mono">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          <form onSubmit={handleAdd} className="relative group">
            <Input
              placeholder="Add a new non-negotiable..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="h-14 pl-6 pr-14 bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 rounded-2xl text-lg transition-all"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-zinc-100 hover:bg-white text-black transition-all hover:scale-105"
              disabled={isCreating || !newItem.trim()}
            >
              <Plus className="size-5" />
            </Button>
          </form>
        </section>

        {/* LIST SECTION */}
        <section className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-zinc-900/30 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((item: NonNegotiable) => (
                <PremiumTaskCard
                  key={item.id}
                  item={item}
                  isCompleted={isCompletedToday(item)}
                  onToggle={() => {
                    setTogglingId(item.id);
                    toggleMutation({ id: item.id, date: today });
                  }}
                  onDelete={() => deleteMutation.mutate(item.id)}
                  isToggling={togglingId === item.id}
                />
              ))}

              {items.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-3xl">
                  <p className="text-zinc-500">No protocols set.</p>
                  <p className="text-zinc-600 text-sm mt-2">
                    Discipline = Freedom
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
