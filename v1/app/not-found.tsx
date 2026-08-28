import Link from "next/link";
import { Button } from "@/components/ui/button";
import { dictionaries } from "@/lib/dictionaries";

export default function NotFound() {
  const lang = typeof document !== "undefined" && document.cookie.includes("sunvolt_lang=en") ? "en" : "bn";
  const d = dictionaries[lang];
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="text-5xl" aria-hidden>🔎</span>
      <h1 className="mt-4 text-2xl font-extrabold text-navy">{d.errors.nfTitle}</h1>
      <p className="mt-2 text-muted-foreground">
        {d.errors.nfSub}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="font-bold">
          <Link href="/">{d.errors.home}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/packages">{d.nav.packages}</Link>
        </Button>
      </div>
    </div>
  );
}
