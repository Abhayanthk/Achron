import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared shell for the page's tiles. One border weight, one radius, one
 * background — repeated exactly, so the eye reads the page as a single object
 * rather than a stack of unrelated widgets.
 *
 * Fills its grid cell (`h-full`) and lays its children out as a column, so a
 * tile that lands in a tall row can push its footer down with `mt-auto` or let
 * its main body grow with `flex-1` instead of leaving dead space at the bottom.
 */
export function Panel({
      children,
      className,
}: {
      children: ReactNode;
      className?: string;
}) {
      return (
            <section
                  className={cn(
                        "flex h-full flex-col rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-5 backdrop-blur-xl sm:p-6",
                        className,
                  )}
            >
                  {children}
            </section>
      );
}

/** Small caps field label. Quiet by design: the content is the subject, not the form. */
export function FieldLabel({
      children,
      htmlFor,
}: {
      children: ReactNode;
      htmlFor?: string;
}) {
      const className =
            "text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500";

      return htmlFor ? (
            <label htmlFor={htmlFor} className={cn("block", className)}>
                  {children}
            </label>
      ) : (
            <span className={cn("block", className)}>{children}</span>
      );
}

/**
 * Thin horizontal bar for a rate. Deliberately the same shape everywhere it
 * appears so two different numbers can't imply two different kinds of judgement.
 */
export function RateBar({
      percentage,
      className,
}: {
      percentage: number;
      className?: string;
}) {
      return (
            <div
                  className={cn(
                        "h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]",
                        className,
                  )}
            >
                  <div
                        className="h-full rounded-full bg-indigo-500/80 transition-[width] duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                  />
            </div>
      );
}
