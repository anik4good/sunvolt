import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PackageCard } from "@/components/site/package-card";
import { getBackupPackages, getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "সোলার ব্যাকআপ প্যাকেজ",
  description:
    "SunVolt সোলার ব্যাকআপ প্যাকেজ — লিথিয়াম ব্যাটারি, সোলার প্যানেল ও চার্জ কন্ট্রোলারসহ সম্পূর্ণ কম্বো সমাধান।",
};

export default async function PackagesPage() {
  const [settings, packages] = await Promise.all([
    getSettings(),
    getBackupPackages(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-navy">সব প্যাকেজ</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          প্রয়োজন অনুযায়ী প্রস্তুত সোলার ব্যাকআপ কম্বো প্যাকেজ। কোনটি আপনার জন্য
          উপযুক্ত নিশ্চিত নন?
        </p>
        <Button asChild size="lg" className="mt-5 h-13 text-base font-bold">
          <Link href="/calculator">🔋 ব্যাকআপ হিসাব করুন</Link>
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
            />
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          এই মুহূর্তে কোনো প্যাকেজ উপলব্ধ নেই।
        </p>
      )}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        *ব্যাকআপ সময় লোডের ধরন, ব্যবহার পদ্ধতি, ব্যাটারির অবস্থা ও অন্যান্য
        পরিস্থিতির উপর নির্ভরশীল।
      </p>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        আলাদা আলাদা প্রোডাক্ট কিনতে চান?{" "}
        <Link href="/products" className="font-semibold text-navy hover:underline">
          সব প্রোডাক্ট দেখুন →
        </Link>
      </p>
    </div>
  );
}
