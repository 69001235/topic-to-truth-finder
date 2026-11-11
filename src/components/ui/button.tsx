import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * One primary action per screen (`default`), clearly different secondary actions
 * (`secondary`: bordered, no fill) and low-emphasis ones (`ghost`, `link`).
 * `danger` is the secondary-weight style for destructive actions; `destructive`
 * is the filled version, reserved for confirmation dialogs.
 * Flat by design: no shadows and no transitions. Minimum height 44 px.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border-2 border-transparent text-center text-base font-semibold no-underline cursor-pointer disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "border-primary bg-background text-primary hover:bg-accent",
        outline: "border-primary bg-background text-primary hover:bg-accent",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
        danger: "border-destructive bg-background text-destructive hover:bg-destructive-soft",
        ghost: "text-primary underline underline-offset-4 hover:bg-accent",
        link: "text-primary underline underline-offset-4 hover:text-primary-hover",
      },
      size: {
        default: "min-h-11 px-5 py-2",
        sm: "min-h-10 px-4 py-1.5 text-sm",
        lg: "min-h-12 px-6 py-2.5",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
