import * as React from "react";
import TextareaAutosize, {
  TextareaAutosizeProps,
} from "react-textarea-autosize";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "style">,
    Pick<TextareaAutosizeProps, "minRows" | "maxRows" | "onHeightChange"> {
  style?: React.CSSProperties;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, minRows = 3, style, ...props }, ref) => {
    return (
      <TextareaAutosize
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className,
        )}
        ref={ref as any}
        minRows={minRows}
        style={style as any}
        {...(props as any)}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
