"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateLevelFromXp, TITLES } from "@/lib/level-system";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function LevelProfileCard() {
  const { data: xpData = [] } = useQuery({
    queryKey: ["analytics", "xp", "all"],
    queryFn: async () => {
      const res = await axios.get("/api/analytics?type=xp&range=all");
      return res.data.data;
    },
  });

  const totalXp = xpData.reduce(
    (acc: number, curr: any) => acc + curr.amount,
    0
  );
  const { level, currentXp, nextLevelXp, progress, title } =
    calculateLevelFromXp(totalXp);

  const nextTitle =
    TITLES.find((t) => t.minLevel > level) || TITLES[TITLES.length - 1];

  return (
    <div className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
      {/* Background Effects - Dynamic based on Tier Color */}
      <div
        className="absolute top-0 right-0 p-32 blur-[120px] rounded-full opacity-10 group-hover:opacity-20 transition-all duration-700"
        style={{ backgroundColor: title.shadowColor }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-12">
        {/* Left Side: Avatar/Icon & Basic Info */}
        <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto text-center md:text-left">
          <div className="relative group/icon">
            <div
              className={cn(
                "h-28 w-28 rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl relative z-10 overflow-hidden bg-zinc-950"
              )}
            >
              {/* Inner Glow */}
              <div
                className={cn(
                  "absolute inset-0 opacity-20 bg-gradient-to-br",
                  title.bgGradient
                )}
              />

              {/* Icon - Correctly rendered as a component now */}
              <title.icon
                className={cn(
                  "size-12 drop-shadow-lg relative z-10 transition-transform duration-500 group-hover/icon:scale-110",
                  title.color
                )}
                strokeWidth={1.5}
              />
            </div>

            {/* Level Badge */}
            <div
              className={cn(
                "absolute -bottom-3 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:-right-3 text-white text-xs font-bold px-3 py-1 rounded-full border-4 border-black z-20 shadow-lg whitespace-nowrap bg-gradient-to-r",
                title.bgGradient
              )}
            >
              Lvl {level}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h2
                className={cn(
                  "text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r",
                  title.bgGradient
                )}
              >
                {title.name}
              </h2>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-zinc-500 hover:text-white transition-colors p-1">
                    <Info className="size-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-4xl max-h-[85vh] overflow-y-auto w-full">
                  <DialogHeader>
                    <DialogTitle className="text-xl">
                      Pathway of Ascension
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
                    {TITLES.map((t) => (
                      <div
                        key={t.name}
                        className={cn(
                          "p-4 rounded-2xl border flex flex-col gap-4 transition-all relative overflow-hidden group/card",
                          level >= t.minLevel && level <= t.maxLevel
                            ? "bg-zinc-900 border-zinc-700 ring-1 ring-zinc-600"
                            : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        {/* Card Background Glow */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover/card:opacity-5 transition-opacity duration-500"
                          style={{ backgroundColor: t.shadowColor }}
                        />

                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              "p-2 rounded-lg bg-zinc-900/50 border border-white/5",
                              t.color
                            )}
                          >
                            <t.icon className="size-6" strokeWidth={1.5} />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md">
                            Lvl {t.minLevel}-{t.maxLevel}
                          </span>
                        </div>

                        <div>
                          <h4 className={cn("font-bold text-lg mb-1", t.color)}>
                            {t.name}
                          </h4>
                          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                            {t.description}
                          </p>
                        </div>

                        {level >= t.minLevel && level <= t.maxLevel && (
                          <div className="absolute top-2 right-2">
                            <span className="flex h-2 w-2 relative">
                              <span
                                className={cn(
                                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                  t.color.replace("text-", "bg-")
                                )}
                              ></span>
                              <span
                                className={cn(
                                  "relative inline-flex rounded-full h-2 w-2",
                                  t.color.replace("text-", "bg-")
                                )}
                              ></span>
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-zinc-400 text-sm max-w-md font-medium leading-relaxed">
              {title.description}
            </p>
          </div>
        </div>

        {/* Right Side: XP Progress */}
        <div className="w-full md:min-w-[400px] flex-1 bg-zinc-900/30 p-5 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
            <span>Ascension Progress</span>
            <span className={title.color}>
              {currentXp.toLocaleString()}{" "}
              <span className="text-zinc-600">/</span>{" "}
              {nextLevelXp.toLocaleString()} XP
            </span>
          </div>

          <div className="relative h-3 bg-black rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className={cn(
                "h-full shadow-lg relative",
                title.bgGradient.replace("text-", "bg-")
              )}
            >
              <div
                className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                }}
              />
            </motion.div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-zinc-700" />
              <span className="text-xs text-zinc-500 font-medium">
                Next Tier:{" "}
                <span className="text-zinc-300 ml-1">{nextTitle.name}</span>
              </span>
            </div>
            <span className={cn("text-sm font-mono font-bold", title.color)}>
              {progress.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
