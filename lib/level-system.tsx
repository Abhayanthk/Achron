import {
  LucideIcon,
  Sparkles,
  Flame,
  ScrollText,
  Compass,
  Trello,
  BrainCircuit,
  Swords,
  Star,
  Crown,
  Globe,
  Zap,
} from "lucide-react";

export type TitleTier =
  | "Initiate"
  | "Awakened"
  | "Disciple"
  | "Pathfinder"
  | "Architect"
  | "Strategist"
  | "Commander"
  | "Ascendant"
  | "Overlord"
  | "Mythic"
  | "Legend";

interface TitleInfo {
  name: TitleTier;
  minLevel: number;
  maxLevel: number; // Inclusive
  description: string;
  icon: LucideIcon; // Changed from string to LucideIcon
  tierIndex: number; // The 'x' in the formula
  color: string; // Tailwind text color class or hex
  bgGradient: string; // Background gradient class for badge
  shadowColor: string; // Shadow color for effects
}

export const TITLES: TitleInfo[] = [
  {
    name: "Initiate",
    minLevel: 1,
    maxLevel: 9,
    description: "You've stepped onto the path. You are fragile, but chosen.",
    icon: Sparkles,
    tierIndex: 1,
    color: "text-zinc-400",
    bgGradient: "from-zinc-500 to-zinc-700",
    shadowColor: "rgba(161, 161, 170, 0.5)",
  },
  {
    name: "Awakened",
    minLevel: 10,
    maxLevel: 19,
    description: "Discipline is forming. You no longer drift.",
    icon: Flame,
    tierIndex: 2,
    color: "text-orange-500",
    bgGradient: "from-orange-500 to-red-600",
    shadowColor: "rgba(249, 115, 22, 0.5)",
  },
  {
    name: "Disciple",
    minLevel: 20,
    maxLevel: 29,
    description: "You follow systems, not moods.",
    icon: ScrollText,
    tierIndex: 3,
    color: "text-amber-400",
    bgGradient: "from-amber-400 to-yellow-600",
    shadowColor: "rgba(251, 191, 36, 0.5)",
  },
  {
    name: "Pathfinder",
    minLevel: 30,
    maxLevel: 39,
    description: "You carve your own routes. Others hesitate — you move.",
    icon: Compass,
    tierIndex: 4,
    color: "text-emerald-400",
    bgGradient: "from-emerald-400 to-teal-600",
    shadowColor: "rgba(52, 211, 153, 0.5)",
  },
  {
    name: "Architect",
    minLevel: 40,
    maxLevel: 49,
    description: "You don't just act. You design.",
    icon: Trello,
    tierIndex: 5,
    color: "text-blue-400",
    bgGradient: "from-blue-400 to-indigo-600",
    shadowColor: "rgba(96, 165, 250, 0.5)",
  },
  {
    name: "Strategist",
    minLevel: 50,
    maxLevel: 59,
    description: "You think in second-order effects.",
    icon: BrainCircuit,
    tierIndex: 6,
    color: "text-violet-400",
    bgGradient: "from-violet-400 to-purple-600",
    shadowColor: "rgba(167, 139, 250, 0.5)",
  },
  {
    name: "Commander",
    minLevel: 60,
    maxLevel: 69,
    description: "You execute relentlessly. Chaos bends.",
    icon: Swords,
    tierIndex: 7,
    color: "text-red-500",
    bgGradient: "from-red-500 to-rose-700",
    shadowColor: "rgba(239, 68, 68, 0.5)",
  },
  {
    name: "Ascendant",
    minLevel: 70,
    maxLevel: 79,
    description: "Your baseline is what others call excellence.",
    icon: Star,
    tierIndex: 8,
    color: "text-cyan-400",
    bgGradient: "from-cyan-400 to-sky-600",
    shadowColor: "rgba(34, 211, 238, 0.5)",
  },
  {
    name: "Overlord",
    minLevel: 80,
    maxLevel: 89,
    description: "You dominate time, focus, and priorities.",
    icon: Crown,
    tierIndex: 9,
    color: "text-yellow-400",
    bgGradient: "from-yellow-400 to-amber-600",
    shadowColor: "rgba(250, 204, 21, 0.5)",
  },
  {
    name: "Mythic",
    minLevel: 90,
    maxLevel: 99,
    description: "You are rare. Most never arrive here.",
    icon: Globe,
    tierIndex: 10,
    color: "text-fuchsia-500",
    bgGradient: "from-fuchsia-500 to-pink-600",
    shadowColor: "rgba(217, 70, 239, 0.5)",
  },
  {
    name: "Legend",
    minLevel: 100,
    maxLevel: 1000,
    description: "Unbounded.",
    icon: Zap,
    tierIndex: 11,
    color: "text-white",
    bgGradient: "from-white to-zinc-400",
    shadowColor: "rgba(255, 255, 255, 0.8)",
  },
];

// Base XP formula: 800 * (1.3 ^ x)
export const getXpReqForLevel = (level: number): number => {
  if (level < 1) return 0;
  const title = TITLES.find((t) => level >= t.minLevel && level <= t.maxLevel);
  const x = title ? title.tierIndex : 1;
  return Math.floor(800 * Math.pow(1.3, x));
};

export const getTotalXpForLevel = (targetLevel: number): number => {
  let total = 0;
  for (let i = 1; i < targetLevel; i++) {
    total += getXpReqForLevel(i);
  }
  return total;
};

export const calculateLevelFromXp = (totalXp: number) => {
  let level = 1;
  let xpRemaining = totalXp;

  while (true) {
    const req = getXpReqForLevel(level);
    if (xpRemaining < req) {
      break;
    }
    xpRemaining -= req;
    level++;
  }

  const currentTitle =
    TITLES.find((t) => level >= t.minLevel && level <= t.maxLevel) ||
    TITLES[TITLES.length - 1];
  const nextLevelXp = getXpReqForLevel(level);

  return {
    level,
    currentXp: xpRemaining,
    nextLevelXp,
    progress: Math.min(100, (xpRemaining / nextLevelXp) * 100),
    title: currentTitle, // Now contains LucideIcon and color props
  };
};
