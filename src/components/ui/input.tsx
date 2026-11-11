import * as React from "react";

import { cn } from "@/lib/utils";

/** Flat text field: 2 px border that reaches 3:1 contrast, 44 px tall, no shadow. */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-11 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
