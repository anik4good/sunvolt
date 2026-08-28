import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PackageCard } from "@/components/site/package-card";
import { getBackupPackages, getSettings } from "@/lib/queries";
import { getDict } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getDict();
  return {
    title: d.packages.title,
    description: d.packages.sub,
  };
}

export default async function PackagesPage() {
  const [{ lang, d }, settings, packages] = await Promise.all([
    getDict(),
    getSettings(),
    getBackupPackages(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-navy">{d.packages.title}</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">{d.packages.sub}</p>
        <Button asChild size="lg" className="mt-5 h-13 text-base font-bold">
          <Link href="/calculator">{d.packages.cta}</Link>
        </Button>
      </header>

      {packages.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((product) => (
            <PackageCard
              key={product.id}
              product={product}
              currency={settings.currency}
              featured={product.featured}
              lang={lang}
              d={d}
            />
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {d.packages.empty}
        </p>
      )}
      <p className="mt-6 text-center text-xs text-muted-foreground">{d.packages.disclaimer}</p>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        {d.packages.productsLine}{" "}
        <Link href="/products" className="font-semibold text-navy hover:underline">
          {d.packages.productsLink}
        </Link>
      </p>
    </div>
  );
}
