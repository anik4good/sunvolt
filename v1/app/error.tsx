"use client";

import { Button } from "@/components/ui/button";
import { dictionaries, fmt } from "@/lib/dictionaries";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // error.tsx can't be async — read the cookie synchronously from document
  const lang = typeof document !== "undefined" && document.cookie.includes("sunvolt_lang=en") ? "en" : "bn";
  const d = dictionaries[lang];
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="text-5xl" aria-hidden>🔌</span>
      <h1 className="mt-4 text-2xl font-extrabold text-navy">
        {d.errors.title}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {d.errors.sub}
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {fmt(d.errors.ref, { n: error.digest ?? "" })}
        </p>
      ) : null}
      <Button onClick={reset} size="lg" className="mt-6 font-bold">
        {d.errors.retry}
      </Button>
    </div>
  );
}
