"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for the admin panel. Without this, a render error in any
 * admin page takes out the whole tab with no way back; here the sidebar
 * survives and the user gets a one-click recovery.
 */
export default function AdminPanelError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <span className="text-4xl" aria-hidden>
        🔌
      </span>
      <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page hit an unexpected error. Try again — if it keeps happening,
        reload the tab.
      </p>
      {error.digest ? (
        <p className="text-xs text-muted-foreground">Ref: {error.digest}</p>
      ) : null}
      <Button onClick={retry} size="sm" className="mt-2 font-semibold">
        Try again
      </Button>
    </div>
  );
}
