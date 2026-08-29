"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight toggle switch (no radix dep), styled after the template's
 * table switches. Pass checkedClass to vary the on-color per column
 * (e.g. sky for Published, pink for Featured).
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  checkedClass = "bg-emerald-600",
  className,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange?: (next: boolean) => void;
  disabled?: boolean;
  checkedClass?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? checkedClass : "bg-gray-300 dark:bg-gray-600",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
