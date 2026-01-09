export type HabitRank = 
  | "Initiate"
  | "Apprentice"
  | "Adept"
  | "Strategist"
  | "Master"
  | "Master of Masters";

export const HABIT_RANKS: { name: HabitRank; minDays: number; maxDays: number | null; color: string }[] = [
  { name: "Initiate", minDays: 0, maxDays: 20, color: "text-zinc-500" },
  { name: "Apprentice", minDays: 21, maxDays: 49, color: "text-blue-500" },
  { name: "Adept", minDays: 50, maxDays: 99, color: "text-purple-500" },
  { name: "Strategist", minDays: 100, maxDays: 179, color: "text-yellow-500" },
  { name: "Master", minDays: 180, maxDays: 364, color: "text-orange-500" },
  { name: "Master of Masters", minDays: 365, maxDays: null, color: "text-red-500" },
];

export function getHabitRank(streak: number) {
  const rank = HABIT_RANKS.find(
    (r) => streak >= r.minDays && (r.maxDays === null || streak <= r.maxDays)
  ) || HABIT_RANKS[0];

  const nextRank = HABIT_RANKS.find((r) => r.minDays > rank.minDays);
  
  return {
    currentRank: rank.name,
    color: rank.color,
    minDays: rank.minDays,
    maxDays: rank.maxDays,
    nextRankThreshold: nextRank ? nextRank.minDays : null,
    progress: nextRank 
      ? Math.min(100, Math.max(0, ((streak - rank.minDays) / (nextRank.minDays - rank.minDays)) * 100))
      : 100, // Max rank
  };
}
