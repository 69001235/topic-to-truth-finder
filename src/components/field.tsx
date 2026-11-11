import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type FieldProps = {
  label: string;
  /** Short help shown under the label and tied to the control. */
  hint?: ReactNode;
  /** Error message; marks the control as invalid and is announced with it. */
  error?: string | undefined;
  /** Fields are required by default; only optional ones are marked. */
  optional?: boolean;
  className?: string;
  /** Receives the props that tie the control to its label, hint and error. */
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * Form field in the public-service pattern: always-visible label, optional hint,
 * and an error message linked to the control with `aria-describedby`.
 * The hint and the error live outside the `<label>` so the accessible name stays clean.
 */
export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ");

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="block font-semibold">
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>}
      </label>
      {hint && (
        <p id={hintId} className="text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="font-semibold text-destructive">
          <span className="sr-only">Erro: </span>
          {error}
        </p>
      )}
      {children({
        id,
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(error ? { "aria-invalid": true as const } : {}),
      })}
    </div>
  );
}
