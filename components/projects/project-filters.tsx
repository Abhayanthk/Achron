"use client";

import {
  LucideIcon,
  LayoutGrid,
  Zap,
  PauseCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ProjectFilterType =
  | "ALL"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "DELETED";

interface ProjectFiltersProps {
  currentFilter: ProjectFilterType;
  onFilterChange: (filter: ProjectFilterType) => void;
}

interface FilterOption {
  id: ProjectFilterType;
  label: string;
  icon: LucideIcon;
  color?: string;
}

const FILTERS: FilterOption[] = [
  { id: "ALL", label: "Overview", icon: LayoutGrid },
  { id: "ACTIVE", label: "Active", icon: Zap, color: "text-blue-500" },
  {
    id: "ON_HOLD",
    label: "On Hold",
    icon: PauseCircle,
    color: "text-amber-500",
  },
  {
    id: "COMPLETED",
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-500",
  },
  { id: "DELETED", label: "Trash", icon: Trash2, color: "text-red-500" },
];

export function ProjectFilters({
  currentFilter,
  onFilterChange,
}: ProjectFiltersProps) {
  return (
    <div className="space-y-1">
      {FILTERS.map((item) => {
        const isActive = currentFilter === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onFilterChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                isActive && item.color ? item.color : "text-zinc-500",
                isActive && !item.color && "text-white"
              )}
            />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
