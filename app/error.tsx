"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="text-5xl" aria-hidden>🔌</span>
      <h1 className="mt-4 text-2xl font-extrabold text-navy">
        একটি সাময়িক সমস্যা হয়েছে
      </h1>
      <p className="mt-2 text-muted-foreground">
        অনুগ্রহ করে আবার চেষ্টা করুন। সমস্যা চলতে থাকলে আমাদের কল করুন।
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-muted-foreground">
          রেফারেন্স: {error.digest}
        </p>
      ) : null}
      <Button onClick={reset} size="lg" className="mt-6 font-bold">
        আবার চেষ্টা করুন
      </Button>
    </div>
  );
}
