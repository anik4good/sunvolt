"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BatteryCharging, Minus, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplianceIcon } from "@/components/appliance-icon";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import {
  calculateEnergyRequirement,
  calculateTotalLoad,
  recommendPackage,
  sizeSystem,
} from "@/lib/solar";
import type { CalculationSettings, PackageLike } from "@/lib/solar/types";
import { formatPrice } from "@/lib/format";
import { fmt, num, type Dictionary, type Lang } from "@/lib/dictionaries";
import { whatsappUrl } from "@/lib/whatsapp";

interface ApplianceOption {
  id: string;
  name: string;
  defaultWatt: number;
  icon: string;
  category: string;
}

interface PackageOption extends PackageLike {
  price: string;
}

interface HomeCalculatorProps {
  appliances: ApplianceOption[];
  packages: PackageOption[];
  currency: string;
  phone: string;
  whatsapp: string;
  calcSettings: CalculationSettings;
  lang: Lang;
  d: Dictionary;
}

const HOUR_PRESETS = [3, 6, 12];
type Mode = "dc" | "ac";

/** Compact version of the main calculator for the homepage. */
export function HomeCalculator({
  appliances,
  packages,
  currency,
  phone,
  whatsapp,
  calcSettings,
  lang,
  d,
}: HomeCalculatorProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [backupHours, setBackupHours] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sunvolt:home-calc");
      if (raw) {
        const draft = JSON.parse(raw) as {
          quantities?: Record<string, number>;
          backupHours?: number | null;
          mode?: Mode | null;
        };
        if (draft.quantities) setQuantities(draft.quantities);
        if (typeof draft.backupHours === "number") setBackupHours(draft.backupHours);
        if (draft.mode === "dc" || draft.mode === "ac") setMode(draft.mode);
      }
    } catch {
      // ignore malformed drafts
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sunvolt:home-calc", JSON.stringify({ quantities, backupHours, mode }));
    } catch {
      // storage unavailable — session-only state
    }
  }, [quantities, backupHours, mode]);

  // Appliances for the chosen system type — AC mode shows the "ac"
  // category, DC mode everything else.
  const modeAppliances = useMemo(
    () =>
      appliances
        .filter((a) => (mode === "ac" ? a.category === "ac" : a.category !== "ac"))
        // bulbs first, fans second — stable sort keeps the rest in DB order
        .sort((a, b) => Number(a.icon === "fan") - Number(b.icon === "fan")),
    [appliances, mode],
  );

  const selected = useMemo(
    () =>
      modeAppliances
        .filter((a) => (quantities[a.id] ?? 0) > 0)
        .map((a) => ({ id: a.id, name: a.name, watt: a.defaultWatt, quantity: quantities[a.id] })),
    [modeAppliances, quantities],
  );

  const load = useMemo(() => calculateTotalLoad(selected), [selected]);
  const energy =
    backupHours !== null && load.totalWatt > 0
      ? calculateEnergyRequirement(load.totalWatt, backupHours)
      : 0;
  const recommendation = useMemo(() => {
    if (mode !== "dc" || backupHours === null || load.totalWatt <= 0 || energy <= 0) {
      return null;
    }
    return recommendPackage(packages, load.totalWatt, energy, calcSettings);
  }, [mode, packages, load.totalWatt, backupHours, energy, calcSettings]);

  // Compact system spec (battery/panel/controller) — same engine as the
  // full calculator, condensed to one row.
  const spec = useMemo(() => {
    if (mode !== "dc" || backupHours === null || load.totalWatt <= 0) return null;
    return sizeSystem(load.totalWatt, backupHours, calcSettings);
  }, [mode, load.totalWatt, backupHours, calcSettings]);

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
  const n = (value: number | string) => num(value, lang);

  return (
    <section className="mx-auto max-w-3xl px-4">
      <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
        <h2 className="text-center text-2xl font-extrabold text-navy">{d.mini.title}</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">{d.mini.sub}</p>

        {/* AC / DC chooser — compact */}
        {mode === null ? (
          <div className="mx-auto mt-5 grid max-w-xl gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("dc")}
              className="rounded-2xl border-2 border-navy bg-navy px-4 py-5 text-center text-white transition-transform hover:scale-[1.02]"
            >
              <BatteryCharging className="mx-auto size-8 text-solar" aria-hidden />
              <p className="mt-2 text-base font-extrabold">{d.calc.dcTitle}</p>
              <p className="mt-1 text-xs text-white/80">{d.calc.dcDesc}</p>
            </button>
            <button
              type="button"
              onClick={() => setMode("ac")}
              className="rounded-2xl border-2 border-solar bg-solar-light px-4 py-5 text-center transition-transform hover:scale-[1.02]"
            >
              <Zap className="mx-auto size-8 text-solar-dark" aria-hidden />
              <p className="mt-2 text-base font-extrabold text-navy">{d.calc.acTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">{d.calc.acDesc}</p>
            </button>
          </div>
        ) : (
          <>
            {/* Mode switch pills */}
            <div className="mt-4 flex justify-center" role="group" aria-label={d.calc.chooseType}>
              <div className="inline-flex rounded-full border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setMode("dc")}
                  aria-pressed={mode === "dc"}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                    mode === "dc" ? "bg-navy text-white" : "text-navy/70 hover:bg-secondary"
                  }`}
                >
                  🔋 DC
                </button>
                <button
                  type="button"
                  onClick={() => setMode("ac")}
                  aria-pressed={mode === "ac"}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                    mode === "ac" ? "bg-navy text-white" : "text-navy/70 hover:bg-secondary"
                  }`}
                >
                  ⚡ AC
                </button>
              </div>
            </div>

            {/* Appliance steppers */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {modeAppliances.map((appliance) => {
                const qty = quantities[appliance.id] ?? 0;
                return (
                  <div
                    key={appliance.id}
                    className={`rounded-2xl border p-3 text-center ${
                      qty > 0 ? "border-navy/50 bg-secondary/50" : "bg-background"
                    }`}
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-solar-light text-solar-dark">
                      <ApplianceIcon icon={appliance.icon} className="size-7" />
                    </span>
                    <p className="mt-1 text-sm font-semibold text-navy">{appliance.name}</p>
                    <p className="text-xs text-muted-foreground">{n(appliance.defaultWatt)}W</p>
                    <div className="mt-2 flex items-center justify-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        aria-label={`${appliance.name} ${d.mini.decrease}`}
                        disabled={qty === 0}
                        onClick={() => changeQuantity(appliance.id, -1)}
                      >
                        <Minus aria-hidden />
                      </Button>
                      <span className="w-6 text-center text-base font-bold text-navy">
                        {n(qty)}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        className="size-8"
                        aria-label={`${appliance.name} ${d.mini.increase}`}
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
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-navy p-4 text-center text-white">
                <p className="text-xs text-white/70">{d.mini.total}</p>
                <p className="mt-1 text-3xl font-extrabold" aria-live="polite">
                  {n(load.totalWatt)}
                  <span className="text-base font-bold">W</span>
                </p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-center text-xs text-muted-foreground">{d.mini.hours}</p>
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
                      {n(preset)} {d.mini.hourUnit}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Compact system spec — battery / panel / controller (DC) */}
            {spec ? (
              <div className="mt-4 rounded-2xl border bg-secondary/40 p-3">
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
                  <span className="text-sm font-bold text-navy">
                    🔋 {n(spec.batteryAh)}Ah
                  </span>
                  <span className="text-muted-foreground" aria-hidden>·</span>
                  <span className="text-sm font-bold text-navy">
                    ☀️ {n(spec.panelWatt)}W {d.mini.panel}
                  </span>
                  <span className="text-muted-foreground" aria-hidden>·</span>
                  <span className="text-sm font-bold text-navy">
                    ⚡ {n(spec.controllerWatt)}W {d.mini.controller}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Result */}
            {mode === "ac" && backupHours !== null && load.totalWatt > 0 ? (
              <div className="mt-4 rounded-2xl bg-solar-light/70 p-4 text-center ring-1 ring-solar/40">
                <p className="text-sm font-bold text-navy">{d.calc.acTitle2}</p>
                <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row">
                  <WhatsAppButton
                    className="h-11"
                    label={d.calc.contactBtn}
                    href={whatsappUrl(
                      whatsapp,
                      [
                        "Assalamu Alaikum SunVolt,",
                        "",
                        "AC সিস্টেমের জন্য হিসাব করেছি:",
                        `মোট লোড: ${load.totalWatt}W`,
                        `ব্যাকআপ: ${backupHours} ঘণ্টা`,
                        `প্রয়োজনীয় শক্তি: ${energy}Wh`,
                        "",
                        "আমার জন্য উপযুক্ত AC সোলার সিস্টেমের প্রস্তাব জানাবেন।",
                      ].join("\n"),
                    )}
                  />
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-navy/20 px-5 text-sm font-bold text-navy hover:bg-white/60"
                  >
                    {fmt(d.calc.callBtn, { n: phone })}
                  </a>
                </div>
              </div>
            ) : matched ? (
              <div className="mt-4 rounded-2xl bg-solar-light/70 p-4 text-center ring-1 ring-solar/40">
                <p className="text-sm font-semibold text-navy">{d.mini.matched}</p>
                <p className="mt-1 text-xl font-extrabold text-navy">{matched.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatPrice(matched.price, currency)}/- ·{" "}
                  {fmt(d.mini.backupApprox, { n: n(matched.backupHours) })}
                </p>
                <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row">
                  <Button asChild size="sm" className="font-bold">
                    <Link href={`/packages/${matched.slug}`}>{d.mini.viewPkg}</Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={openFullCalculator}
                  >
                    {d.mini.detailCalc}
                  </Button>
                </div>
              </div>
            ) : recommendation?.status === "none" ? (
              <div className="mt-4 rounded-2xl bg-solar-light/70 p-5 text-center ring-2 ring-solar/50">
                <p className="text-base font-bold text-navy sm:text-lg">{d.mini.noneMsg}</p>
                <Button asChild size="lg" className="mt-4 h-14 w-full text-base font-bold">
                  <Link href="/calculator">{d.mini.noneBtn}</Link>
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="lg"
                className="mt-4 h-12 w-full font-bold"
                onClick={openFullCalculator}
              >
                {d.mini.find}
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
