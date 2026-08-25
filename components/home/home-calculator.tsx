"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  calculateEnergyRequirement,
  calculateTotalLoad,
  recommendPackage,
} from "@/lib/solar";
import type { CalculationSettings, PackageLike } from "@/lib/solar/types";
import { formatPrice, toBn } from "@/lib/format";

interface ApplianceOption {
  id: string;
  name: string;
  defaultWatt: number;
  icon: string;
}

interface PackageOption extends PackageLike {
  price: string;
}

interface HomeCalculatorProps {
  appliances: ApplianceOption[];
  packages: PackageOption[];
  currency: string;
  calcSettings: CalculationSettings;
}

const HOUR_PRESETS = [3, 6, 12];

/** Interactive mini-calculator for the homepage (audit §3). */
export function HomeCalculator({
  appliances,
  packages,
  currency,
  calcSettings,
}: HomeCalculatorProps) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [backupHours, setBackupHours] = useState<number | null>(null);

  // Prefill from a previous homepage session (e.g. user scrolled back)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sunvolt:home-calc");
      if (raw) {
        const draft = JSON.parse(raw) as {
          quantities?: Record<string, number>;
          backupHours?: number | null;
        };
        if (draft.quantities) setQuantities(draft.quantities);
        if (typeof draft.backupHours === "number") setBackupHours(draft.backupHours);
      }
    } catch {
      // ignore malformed drafts
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sunvolt:home-calc", JSON.stringify({ quantities, backupHours }));
    } catch {
      // storage unavailable — session-only state
    }
  }, [quantities, backupHours]);

  const selected = useMemo(
    () =>
      appliances
        .filter((a) => (quantities[a.id] ?? 0) > 0)
        .map((a) => ({ id: a.id, name: a.name, watt: a.defaultWatt, quantity: quantities[a.id] })),
    [appliances, quantities],
  );

  const load = useMemo(() => calculateTotalLoad(selected), [selected]);
  const energy =
    backupHours !== null && load.totalWatt > 0
      ? calculateEnergyRequirement(load.totalWatt, backupHours)
      : 0;
  const recommendation = useMemo(() => {
    if (backupHours === null || load.totalWatt <= 0 || energy <= 0) return null;
    return recommendPackage(packages, load.totalWatt, energy, calcSettings);
  }, [packages, load.totalWatt, backupHours, energy, calcSettings]);

  function changeQuantity(id: string, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(20, (prev[id] ?? 0) + delta)),
    }));
  }

  function openFullCalculator() {
    router.push("/calculator");
  }

  const matched = recommendation?.status === "match" ? recommendation.product : null;

  return (
    <section className="mx-auto max-w-3xl px-4">
      <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
        <h2 className="text-center text-2xl font-extrabold text-navy">
          🔋 আপনার ব্যাকআপ হিসাব করুন
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          যে ডিভাইসগুলো চালাতে চান নির্বাচন করুন
        </p>

        {/* Appliance steppers */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {appliances.map((appliance) => {
            const qty = quantities[appliance.id] ?? 0;
            return (
              <div
                key={appliance.id}
                className={`rounded-2xl border p-3 text-center ${
                  qty > 0 ? "border-navy/50 bg-secondary/50" : "bg-background"
                }`}
              >
                <span className="text-2xl" aria-hidden>{appliance.icon}</span>
                <p className="mt-1 text-sm font-semibold text-navy">{appliance.name}</p>
                <p className="text-xs text-muted-foreground">{toBn(appliance.defaultWatt)}W</p>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    aria-label={`${appliance.name} কমান`}
                    disabled={qty === 0}
                    onClick={() => changeQuantity(appliance.id, -1)}
                  >
                    <Minus aria-hidden />
                  </Button>
                  <span className="w-6 text-center text-base font-bold text-navy">
                    {toBn(qty)}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    className="size-8"
                    aria-label={`${appliance.name} বাড়ান`}
                    disabled={qty >= 20}
                    onClick={() => changeQuantity(appliance.id, 1)}
                  >
                    <Plus aria-hidden />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live total + hours */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-navy p-4 text-center text-white">
            <p className="text-xs text-white/70">আপনার মোট লোড</p>
            <p className="mt-1 text-3xl font-extrabold" aria-live="polite">
              {toBn(load.totalWatt)}
              <span className="text-base font-bold">W</span>
            </p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-center text-xs text-muted-foreground">
              কতক্ষণ ব্যাকআপ চান?
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {HOUR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBackupHours(preset)}
                  aria-pressed={backupHours === preset}
                  className={`rounded-xl px-2 py-2 text-sm font-bold transition-colors ${
                    backupHours === preset
                      ? "bg-navy text-white"
                      : "bg-secondary text-navy hover:bg-secondary/70"
                  }`}
                >
                  {toBn(preset)} ঘণ্টা
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        {matched ? (
          <div className="mt-5 rounded-2xl bg-solar-light/70 p-4 text-center ring-1 ring-solar/40">
            <p className="text-sm font-semibold text-navy">আপনার জন্য উপযুক্ত</p>
            <p className="mt-1 text-xl font-extrabold text-navy">{matched.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatPrice(matched.price, currency)}/- · হালকা লোডে প্রায় {toBn(matched.backupHours)} ঘণ্টা*
            </p>
            <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row">
              <Button asChild size="sm" className="font-bold">
                <Link href={`/packages/${matched.slug}`}>বিস্তারিত দেখুন</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openFullCalculator}
              >
                <Search aria-hidden />
                বিস্তারিত হিসাব দেখুন
              </Button>
            </div>
          </div>
        ) : recommendation?.status === "none" ? (
          <div className="mt-5 rounded-2xl bg-solar-light/70 p-4 text-center ring-1 ring-solar/40">
            <p className="text-sm font-bold text-navy">
              আপনার প্রয়োজনীয় লোড স্ট্যান্ডার্ড প্যাকেজের চেয়ে বেশি — কাস্টম সিস্টেম প্রয়োজন।
            </p>
            <Button asChild size="sm" className="mt-3 font-bold">
              <Link href="/calculator">বিস্তারিত হিসাব করুন</Link>
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="lg"
            className="mt-5 h-13 w-full text-base font-bold"
            onClick={openFullCalculator}
          >
            🔋 প্যাকেজ খুঁজে দেখুন
          </Button>
        )}
      </div>
    </section>
  );
}
