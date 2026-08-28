"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Copy-to-clipboard button with brief success feedback. */
export function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable (e.g. insecure origin) — select-fallback:
      // show the value so the user can copy manually.
      setCopied(false);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={copy}
      aria-label={copied ? "Copied" : `Copy ${label ?? "value"}`}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {label ? (copied ? "Copied!" : label) : null}
    </Button>
  );
}
