import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
interface DateNavButtonsProps {
  handleDateChangeLeft: () => void;
  handleDateChangeRight: () => void;
  handleToday: () => void;
  className?: string;
}

export default function DateNavButtons({
  handleDateChangeLeft,
  handleDateChangeRight,
  handleToday,
  className,
}: DateNavButtonsProps) {
  return (
    <div className={cn("flex items-center justify-end gap-2 mb-4", className)}>
      <button
        onClick={handleToday}
        className="px-2 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
      >
        Today
      </button>
      <button
        className="h-8 w-8 flex  items-center justify-center rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
        onClick={handleDateChangeLeft}
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
        onClick={handleDateChangeRight}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
