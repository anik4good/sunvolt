"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteButtonProps {
  label: string;
  confirmText: string;
  action: (
    prev: { message: string } | undefined,
    formData: FormData,
  ) => Promise<{ message: string }>;
  id: string;
  className?: string;
  icon?: React.ReactNode;
}

/**
 * Delete button with confirm() + useActionState so server-action errors
 * (e.g. “orders attached”) surface instead of being swallowed.
 */
export function DeleteButton({
  label,
  confirmText,
  action,
  id,
  className,
  icon,
}: DeleteButtonProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="outline" size="sm" disabled={pending} className={className}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
        {label}
      </Button>
      {state?.message ? (
        <p className="mt-1 max-w-64 text-right text-xs font-medium text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
