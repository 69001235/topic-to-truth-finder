import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Four tones, each with an icon, a left stripe and a soft background so meaning
 * never depends on colour alone. Information and success are announced politely
 * (`role="status"`); warnings and errors assertively (`role="alert"`).
 */
const alertVariants = cva(
  "flex w-full items-start gap-3 rounded-md border border-l-4 p-4 text-base",
  {
    variants: {
      variant: {
        default: "border-l-info bg-info-soft [&>svg]:text-info",
        info: "border-l-info bg-info-soft [&>svg]:text-info",
        success: "border-l-success bg-success-soft [&>svg]:text-success",
        warning: "border-l-warning bg-warning-soft [&>svg]:text-warning",
        destructive: "border-l-destructive bg-destructive-soft [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type AlertTone = NonNullable<VariantProps<typeof alertVariants>["variant"]>;

const icons: Record<AlertTone, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  default: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: CircleAlert,
};

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, children, ...props }, ref) => {
  const tone: AlertTone = variant ?? "default";
  const Icon = icons[tone];
  const role = tone === "warning" || tone === "destructive" ? "alert" : "status";
  return (
    <div ref={ref} role={role} className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
});
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("mb-1 font-semibold", className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("[&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
