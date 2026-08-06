import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared shell for the page's sections. One border weight, one radius, one
 * background — repeated exactly, so the eye reads the page as a single object
 * rather than a stack of unrelated widgets.
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
                        "rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-6 backdrop-blur-xl sm:p-7",
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
