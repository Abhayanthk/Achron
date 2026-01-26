import { cn } from "@/lib/utils";

type SegmentedControlButtonProps<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
  variant?: "solid" | "ghost";
  className?: string;
};

export default function SegmentedControlButton<T extends string>({
  options,
  value,
  onChange,
  size = "sm",
  variant = "solid",
  className,
}: SegmentedControlButtonProps<T>) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg p-0.5",
        variant === "solid" && "bg-zinc-950 border border-white/5",
        variant === "ghost" && "bg-transparent",
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-md font-bold uppercase tracking-wider transition-all",
            size === "sm" && "px-2 py-1 text-[10px]",
            size === "md" && "px-4 py-1.5 text-xs",
            value === opt
              ? "bg-white text-black"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
