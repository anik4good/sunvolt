"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/dictionaries";

/**
 * Bengali/English switch shown in the header. Sets the language cookie
 * and refreshes — every server component re-renders in the new language.
 */
export function LangToggle({ lang, className }: { lang: Lang; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Lang) {
    if (next === lang || pending) return;
    document.cookie = `sunvolt_lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={cn("inline-flex overflow-hidden rounded-full border", className)}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => switchTo("bn")}
        aria-pressed={lang === "bn"}
        className={cn(
          "px-3 py-1.5 text-xs font-bold transition-colors",
          lang === "bn" ? "bg-navy text-white" : "text-navy/70 hover:bg-secondary",
        )}
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-pressed={lang === "en"}
        className={cn(
          "px-3 py-1.5 text-xs font-bold transition-colors",
          lang === "en" ? "bg-navy text-white" : "text-navy/70 hover:bg-secondary",
        )}
      >
        EN
      </button>
    </div>
  );
}
