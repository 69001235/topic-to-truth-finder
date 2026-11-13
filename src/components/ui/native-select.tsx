import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Native `<select>` styled like `Input`. The browser's own control keeps full
 * keyboard and screen-reader support, which a custom listbox would have to rebuild.
 */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex min-h-11 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-base text-foreground disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
