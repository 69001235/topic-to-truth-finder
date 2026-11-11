import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-32 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
