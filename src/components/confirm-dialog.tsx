import { useCallback, useRef, useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as a destructive action. */
  destructive?: boolean;
};

/**
 * Accessible replacement for `window.confirm`: focus moves into the dialog,
 * Escape cancels, and focus returns to the trigger afterwards.
 *
 * Usage: `const { confirm, dialog } = useConfirm();` render `{dialog}` once and
 * `if (!(await confirm({ ... }))) return;` before the action.
 */
export function useConfirm(): {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  dialog: ReactNode;
} {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback((next: ConfirmOptions) => {
    // A new request while one is open cancels the previous one.
    resolver.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOptions(next);
    });
  }, []);

  const dialog = (
    <AlertDialog
      open={options !== null}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          <AlertDialogDescription>{options?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{options?.cancelLabel ?? "Cancelar"}</AlertDialogCancel>
          <AlertDialogAction
            className={
              options?.destructive ? buttonVariants({ variant: "destructive" }) : undefined
            }
            onClick={() => settle(true)}
          >
            {options?.confirmLabel ?? "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}
