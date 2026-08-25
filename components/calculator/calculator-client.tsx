"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Zap, BatteryCharging } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { ApplianceIcon } from "@/components/appliance-icon";
import { useCart } from "@/components/cart/cart-provider";
import {
  calculateBatteryRequirement,
  calculateEnergyRequirement,
  calculateTotalLoad,
  recommendPackage,
  sizeSystem,
} from "@/lib/solar";
import type {
  ApplianceInput,
  CalculationSettings,
  PackageLike,
} from "@/lib/solar/types";
import { formatPrice } from "@/lib/format";
import { fmt, num, type Dictionary, type Lang } from "@/lib/dictionaries";
import { customSystemInquiryMessage, whatsappUrl } from "@/lib/whatsapp";

interface ApplianceOption {
  id: string;
  name: string;
  defaultWatt: number;
  icon: string;
  category: string;
}

interface PackageOption extends PackageLike {
  batteryType: string;
  solarPanelWatt: number | null;
  controllerWatt: number | null;
  price: string;
  featured: boolean;
}

interface CustomItem {
  key: string;
  name: string;
  watt: number;
  quantity: number;
}

interface CalculatorClientProps {
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
/** Standard SunVolt package voltage, used for the detailed battery estimate. */
const STANDARD_VOLTAGE = 12.6;

type CalculatorMode = "dc" | "ac";

export function CalculatorClient({
  appliances,
  packages,
  currency,
  phone,
  whatsapp,
  calcSettings,
  lang,
  d,
}: CalculatorClientProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [mode, setMode] = useState<CalculatorMode | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [backupHours, setBackupHours] = useState<number | null>(null);
  const [customHours, setCustomHours] = useState("");

  // Appliances for the selected system type: AC mode shows the "ac"
  // category, DC mode everything else.
  const modeAppliances = useMemo(
    () =>
      appliances
        .filter((a) => (mode === "ac" ? a.category === "ac" : a.category !== "ac"))
        // bulbs first, fans second — stable sort keeps the rest in DB order
        .sort((a, b) => Number(a.icon === "fan") - Number(b.icon === "fan")),
    [appliances, mode],
  );

  // Continue where the homepage mini-calculator left off, if the user
  // tapped "see full calculation" there.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sunvolt:home-calc");
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        quantities?: Record<string, number>;
        backupHours?: number | null;
        mode?: "dc" | "ac" | null;
      };
      if (draft.quantities) setQuantities(draft.quantities);
      if (typeof draft.backupHours === "number") setBackupHours(draft.backupHours);
      // Landing from the homepage mini-calculator: skip the AC/DC chooser
      // and continue directly in the same system type.
      if (draft.mode === "dc" || draft.mode === "ac") setMode(draft.mode);
    } catch {
      // ignore malformed drafts
    }
  }, []);

  // Custom appliance form state
  const [deviceName, setDeviceName] = useState("");
  const [deviceWatt, setDeviceWatt] = useState("");
  const [deviceQty, setDeviceQty] = useState("1");
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const selected: ApplianceInput[] = useMemo(
    () => [
      ...modeAppliances
        .filter((a) => (quantities[a.id] ?? 0) > 0)
        .map((a) => ({
          id: a.id,
          name: a.name,
          watt: a.defaultWatt,
          quantity: quantities[a.id],
          icon: a.icon,
        })),
      ...customItems.map((c) => ({
        id: null,
        name: c.name,
        watt: c.watt,
        quantity: c.quantity,
        icon: "🔌",
      })),
    ],
    [modeAppliances, quantities, customItems],
  );

  const load = useMemo(() => calculateTotalLoad(selected), [selected]);
  const hours = backupHours;
  const energy = hours !== null && load.totalWatt > 0
    ? calculateEnergyRequirement(load.totalWatt, hours)
    : 0;

  // Package matching only applies to DC systems — AC needs a custom
  // inverter-based solution, so AC mode goes straight to contact.
  const recommendation = useMemo(() => {
    if (mode !== "dc" || hours === null || load.totalWatt <= 0 || energy <= 0) {
      return null;
    }
    return recommendPackage(packages, load.totalWatt, energy, calcSettings);
  }, [mode, packages, load.totalWatt, hours, energy, calcSettings]);

  // Full custom-system spec (battery/panel/controller) from the sizing
  // engine — shown alongside packages and on the no-package path.
  const systemSpec = useMemo(() => {
    if (mode !== "dc" || hours === null || load.totalWatt <= 0) return null;
    return sizeSystem(load.totalWatt, hours, calcSettings);
  }, [mode, load.totalWatt, hours, calcSettings]);

  function changeQuantity(id: string, delta: number) {
    setQuantities((prev) => {
      const next = Math.max(0, Math.min(20, (prev[id] ?? 0) + delta));
      return { ...prev, [id]: next };
    });
  }

  function addCustomDevice() {
    const name = deviceName.trim();
    const watt = Number(deviceWatt);
    const qty = Number(deviceQty);
    if (!name || name.length > 40) {
      setDeviceError(d.calc.errName);
      return;
    }
    if (!Number.isFinite(watt) || watt < 1 || watt > 2000) {
      setDeviceError(d.calc.errWatt);
      return;
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      setDeviceError(d.calc.errQty);
      return;
    }
    setCustomItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), name, watt, quantity: qty },
    ]);
    setDeviceName("");
    setDeviceWatt("");
    setDeviceQty("1");
    setDeviceError(null);
  }

  function applyCustomHours(value: string) {
    setCustomHours(value);
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 48) {
      setBackupHours(Math.round(parsed));
    }
  }

  function goToOrder(pkg: PackageOption) {
    try {
      localStorage.setItem(
        "sunvolt:calculation",
        JSON.stringify({
          selections: selected,
          totalLoadWatt: load.totalWatt,
          backupHours: hours,
          requiredEnergy: energy,
          recommendedSlug: pkg.slug,
        }),
      );
    } catch {
      // localStorage unavailable — order proceeds without calculator context
    }
    addItem({
      slug: pkg.slug,
      name: pkg.name,
      battery: `${pkg.batteryVoltage}V ${pkg.batteryCapacityAh}Ah ${pkg.batteryType}`,
      price: Number(pkg.price),
    });
    router.push("/cart");
  }

  const matchedProduct =
    recommendation?.status === "match" ? recommendation.product : null;
  const batteryEstimate =
    hours !== null && load.totalWatt > 0
      ? calculateBatteryRequirement(
          energy,
          matchedProduct?.batteryVoltage ?? STANDARD_VOLTAGE,
          calcSettings,
        )
      : null;

  const n = (value: number | string) => num(value, lang);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-navy">{d.calc.title}</h1>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">{d.calc.sub}</p>
      </header>

      {/* System type chooser */}
      {mode === null ? (
        <section className="mt-10" aria-label={d.calc.chooseType}>
          <h2 className="text-center text-xl font-bold text-navy">{d.calc.chooseType}</h2>
          <div className="mx-auto mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("dc")}
              className="rounded-3xl border-2 border-navy bg-navy p-8 text-center text-white shadow-md transition-transform hover:scale-[1.02]"
            >
              <BatteryCharging className="mx-auto size-12 text-solar" aria-hidden />
              <p className="mt-4 text-xl font-extrabold">{d.calc.dcTitle}</p>
              <p className="mt-2 text-sm text-white/80">{d.calc.dcDesc}</p>
            </button>
            <button
              type="button"
              onClick={() => setMode("ac")}
              className="rounded-3xl border-2 border-solar bg-solar-light p-8 text-center shadow-md transition-transform hover:scale-[1.02]"
            >
              <Zap className="mx-auto size-12 text-solar-dark" aria-hidden />
              <p className="mt-4 text-xl font-extrabold text-navy">{d.calc.acTitle}</p>
              <p className="mt-2 text-sm text-muted-foreground">{d.calc.acDesc}</p>
            </button>
          </div>
        </section>
      ) : (
      <>

      {/* Mode switch */}
      <div className="mt-8 flex justify-center" role="group" aria-label={d.calc.chooseType}>
        <div className="inline-flex rounded-full border bg-card p-1">
          <button
            type="button"
            onClick={() => setMode("dc")}
            aria-pressed={mode === "dc"}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
              mode === "dc" ? "bg-navy text-white" : "text-navy/70 hover:bg-secondary"
            }`}
          >
            🔋 DC
          </button>
          <button
            type="button"
            onClick={() => setMode("ac")}
            aria-pressed={mode === "ac"}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
              mode === "ac" ? "bg-navy text-white" : "text-navy/70 hover:bg-secondary"
            }`}
          >
            ⚡ AC
          </button>
        </div>
      </div>

      {/* Step 1 — appliances */}
      <section className="mt-8" aria-labelledby="step-appliances">
        <h2 id="step-appliances" className="flex items-center gap-2 text-xl font-bold text-navy">
          <span className="flex size-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-solar">
            {n(1)}
          </span>
          {d.calc.step1}
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {modeAppliances.map((appliance) => {
            const qty = quantities[appliance.id] ?? 0;
            return (
              <Card
                key={appliance.id}
                className={qty > 0 ? "border-navy/50 ring-1 ring-navy/30" : ""}
              >
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-solar-light text-solar-dark">
                    <ApplianceIcon icon={appliance.icon} className="size-7" />
                  </span>
                  <p className="mt-2 text-sm font-semibold text-navy">
                    {appliance.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {appliance.defaultWatt}W
                  </p>
                  {qty > 0 ? (
                    <p className="mt-1 text-xs font-medium text-leaf">
                      {appliance.defaultWatt}W × {n(qty)} ={" "}
                      {appliance.defaultWatt * qty}W
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-10"
                      aria-label={`${appliance.name} ${d.mini.decrease}`}
                      disabled={qty === 0}
                      onClick={() => changeQuantity(appliance.id, -1)}
                    >
                      <Minus aria-hidden />
                    </Button>
                    <span className="w-8 text-center text-lg font-bold text-navy" aria-live="polite">
                      {n(qty)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      className="size-10"
                      aria-label={`${appliance.name} ${d.mini.increase}`}
                      disabled={qty >= 20}
                      onClick={() => changeQuantity(appliance.id, 1)}
                    >
                      <Plus aria-hidden />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Custom appliance */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-navy">{d.calc.customTitle}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <div>
                <Label htmlFor="device-name" className="text-xs text-muted-foreground">
                  {d.calc.deviceName}
                </Label>
                <Input
                  id="device-name"
                  placeholder={d.calc.namePh}
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="device-watt" className="text-xs text-muted-foreground">
                  {d.calc.deviceWatt}
                </Label>
                <Input
                  id="device-watt"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={2000}
                  placeholder="50"
                  value={deviceWatt}
                  onChange={(e) => setDeviceWatt(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="device-qty" className="text-xs text-muted-foreground">
                  {d.calc.deviceQty}
                </Label>
                <Input
                  id="device-qty"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={20}
                  value={deviceQty}
                  onChange={(e) => setDeviceQty(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={addCustomDevice} className="w-full font-semibold sm:w-auto">
                  {d.calc.add}
                </Button>
              </div>
            </div>
            {deviceError ? (
              <p className="mt-2 text-sm font-medium text-destructive">{deviceError}</p>
            ) : null}

            {customItems.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {customItems.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-navy">
                      🔌 {item.name} — {item.watt}W × {n(item.quantity)} ={" "}
                      {item.watt * item.quantity}W
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label={fmt(d.calc.remove, { n: item.name })}
                      onClick={() =>
                        setCustomItems((prev) => prev.filter((x) => x.key !== item.key))
                      }
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>

        {/* Live total load */}
        <div className="mt-5 rounded-2xl bg-navy p-5 text-center text-white">
          <p className="text-sm text-white/70">{d.calc.dTotal}</p>
          <p className="mt-1 text-4xl font-extrabold" aria-live="polite">
            {n(load.totalWatt)}
            <span className="text-xl font-bold">W</span>
          </p>
          {load.lines.length > 0 ? (
            <div className="mt-3 text-xs text-white/70">
              {load.lines
                .map((l) => `${l.quantity} × ${l.name} (${l.watt}W × ${l.quantity} = ${l.totalWatt}W)`)
                .join(" + ")}
            </div>
          ) : (
            <p className="mt-2 text-xs text-white/60">{d.calc.selectDevices}</p>
          )}
        </div>
      </section>

      {/* Step 2 — backup hours */}
      <section className="mt-10" aria-labelledby="step-hours">
        <h2 id="step-hours" className="flex items-center gap-2 text-xl font-bold text-navy">
          <span className="flex size-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-solar">
            {n(2)}
          </span>
          {d.calc.step2}
        </h2>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {HOUR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setBackupHours(preset);
                setCustomHours("");
              }}
              aria-pressed={backupHours === preset}
              className={`rounded-2xl border p-4 text-center text-lg font-bold transition-colors ${
                backupHours === preset
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-card text-navy hover:bg-secondary"
              }`}
            >
              {n(preset)} {d.calc.hours}
            </button>
          ))}
        </div>

        <div className="mt-4 flex max-w-xs items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="custom-hours" className="text-xs text-muted-foreground">
              {d.calc.customHours}
            </Label>
            <Input
              id="custom-hours"
              type="number"
              inputMode="numeric"
              min={1}
              max={48}
              placeholder={d.calc.examplePh}
              value={customHours}
              onChange={(e) => applyCustomHours(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Result */}
      {hours !== null && load.totalWatt > 0 ? (
        <section className="mt-10" aria-labelledby="result-heading">
          <div className="rounded-3xl bg-solar-light/70 p-6 text-center ring-1 ring-solar/40">
            <p className="text-sm font-semibold text-navy">{d.calc.energyTitle}</p>
            <p className="mt-2 text-5xl font-extrabold text-navy" aria-live="polite">
              {n(energy)}
              <span className="text-2xl">Wh</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {fmt(d.calc.energyCalc, { w: n(load.totalWatt), h: n(hours), e: n(energy) })}
            </p>

            <Accordion type="single" collapsible className="mt-4 text-left">
              <AccordionItem value="details" className="border-none">
                <AccordionTrigger className="justify-center rounded-xl bg-white/70 px-4 py-3 text-sm font-semibold text-navy hover:no-underline">
                  {d.calc.detailShow}
                </AccordionTrigger>
                <AccordionContent className="rounded-xl bg-white/70 px-4 pb-4 text-sm">
                  <ul className="space-y-1">
                    {load.lines.map((line, i) => (
                      <li key={i} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          {n(line.quantity)} × {line.name}
                        </span>
                        <span className="font-medium">
                          {line.watt}W × {n(line.quantity)} = {line.totalWatt}W
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 border-t pt-3">
                    <p className="flex justify-between font-semibold text-navy">
                      <span>{d.calc.dTotal}</span>
                      <span>{load.totalWatt}W</span>
                    </p>
                    <p className="mt-1 flex justify-between">
                      <span className="text-muted-foreground">
                        {fmt(d.calc.dEnergy, { w: load.totalWatt, h: hours })}
                      </span>
                      <span className="font-medium">{energy}Wh</span>
                    </p>
                    {batteryEstimate ? (
                      <p className="mt-1 flex justify-between">
                        <span className="text-muted-foreground">
                          {fmt(d.calc.dBattery, {
                            v: matchedProduct?.batteryVoltage ?? STANDARD_VOLTAGE,
                          })}
                        </span>
                        <span className="font-medium">
                          {fmt(d.calc.dBatteryVal, { n: batteryEstimate.requiredAh })}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Custom system spec — always visible for DC (plan §42) */}
          {mode === "dc" && systemSpec ? (
            <div className="mt-4 rounded-2xl border bg-card p-4 text-sm">
              <p className="font-bold text-navy">{d.calc.specTitle}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <p className="rounded-xl bg-secondary/60 px-3 py-2 font-medium text-navy">
                  {fmt(d.calc.specBattery, { n: n(systemSpec.batteryAh) })}
                </p>
                <p className="rounded-xl bg-secondary/60 px-3 py-2 font-medium text-navy">
                  {fmt(d.calc.specPanel, { n: n(systemSpec.panelWatt) })}
                </p>
                <p className="rounded-xl bg-secondary/60 px-3 py-2 font-medium text-navy">
                  {fmt(d.calc.specController, { n: n(systemSpec.controllerWatt) })}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{d.calc.specNote}</p>
            </div>
          ) : null}

          {/* Recommendation — DC only; AC always goes to contact */}
          {mode === "ac" ? (
            <div className="mt-8 rounded-3xl border border-solar/50 bg-solar-light/50 p-6 text-center">
              <p className="text-lg font-bold text-navy">{d.calc.acTitle2}</p>
              <p className="mt-2 text-muted-foreground">
                {fmt(d.calc.acSub, { w: load.totalWatt, h: hours, e: energy })}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <WhatsAppButton
                  label={d.calc.contactBtn}
                  href={whatsappUrl(
                    whatsapp,
                    [
                      "Assalamu Alaikum SunVolt,",
                      "",
                      "AC সিস্টেমের জন্য হিসাব করেছি:",
                      `মোট লোড: ${load.totalWatt}W`,
                      `ব্যাকআপ: ${hours} ঘণ্টা`,
                      `প্রয়োজনীয় শক্তি: ${energy}Wh`,
                      "",
                      "আমার জন্য উপযুক্ত AC সোলার সিস্টেমের প্রস্তাব জানাবেন।",
                    ].join("\n"),
                  )}
                />
                <a
                  href={`tel:${phone}`}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-navy/20 px-6 text-sm font-bold text-navy hover:bg-white/60"
                >
                  {fmt(d.calc.callBtn, { n: phone })}
                </a>
              </div>
            </div>
          ) : matchedProduct ? (
            <div className="mt-8">
              <h2 id="result-heading" className="text-center text-xl font-bold text-navy">
                {d.calc.recTitle}
              </h2>
              <Card className="mt-4 border-leaf/50 ring-1 ring-leaf/30">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-extrabold text-navy">
                      {matchedProduct.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {fmt(d.calc.recBackup, { n: matchedProduct.backupHours })}
                    </p>
                  </div>

                  <ul className="mx-auto mt-4 max-w-xs space-y-2 text-sm">
                    {matchedProduct.solarPanelWatt ? (
                      <li>{fmt(d.calc.recPanel, { n: matchedProduct.solarPanelWatt })}</li>
                    ) : null}
                    {matchedProduct.controllerWatt ? (
                      <li>{fmt(d.calc.recController, { n: matchedProduct.controllerWatt })}</li>
                    ) : null}
                    <li>
                      🔋 {matchedProduct.batteryVoltage}V {matchedProduct.batteryCapacityAh}Ah{" "}
                      {matchedProduct.batteryType}
                    </li>
                  </ul>

                  <p className="mt-5 text-center text-4xl font-extrabold text-navy">
                    {formatPrice(matchedProduct.price, currency)}
                    <span className="text-base font-normal text-muted-foreground">/-</span>
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    {d.pkgCard.installNote}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      size="lg"
                      className="h-13 flex-1 text-base font-bold"
                      onClick={() => goToOrder(matchedProduct)}
                    >
                      {d.calc.order}
                    </Button>
                    <WhatsAppButton
                      className="h-13 flex-1"
                      href={whatsappUrl(
                        whatsapp,
                        `Assalamu Alaikum SunVolt,\n\nআমি ব্যাকআপ হিসাব করেছি:\nমোট লোড: ${load.totalWatt}W\nব্যাকআপ: ${hours} ঘণ্টা\nপ্রয়োজনীয় শক্তি: ${energy}Wh\n\n${matchedProduct.name} প্যাকেজ সম্পর্কে জানতে চাই।`,
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Why this package (plan §20) */}
              <div className="mt-6 rounded-2xl border bg-card p-5">
                <h3 className="font-bold text-navy">{d.calc.whyTitle}</h3>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>{fmt(d.calc.whyLoad, { n: load.totalWatt })}</p>
                  <p>{fmt(d.calc.whyHours, { n: hours })}</p>
                  <p>{fmt(d.calc.whyEnergy, { n: energy })}</p>
                  <p className="pt-2 font-medium text-navy">
                    {fmt(d.calc.whyChosen, { n: matchedProduct.name })}
                  </p>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">{d.calc.disclaimer}</p>
              </div>
            </div>
          ) : recommendation?.status === "none" ? (
            <div className="mt-8 rounded-3xl border border-solar/50 bg-solar-light/50 p-6 text-center">
              <p className="text-lg font-bold text-navy">{d.calc.noneTitle}</p>
              <p className="mt-1 text-muted-foreground">{d.calc.noneSub}</p>
              {systemSpec ? (
                <div className="mx-auto mt-4 grid max-w-xl gap-2 sm:grid-cols-3">
                  <p className="rounded-xl bg-white/70 px-3 py-3 text-sm font-bold text-navy">
                    {fmt(d.calc.specBattery, { n: n(systemSpec.batteryAh) })}
                  </p>
                  <p className="rounded-xl bg-white/70 px-3 py-3 text-sm font-bold text-navy">
                    {fmt(d.calc.specPanel, { n: n(systemSpec.panelWatt) })}
                  </p>
                  <p className="rounded-xl bg-white/70 px-3 py-3 text-sm font-bold text-navy">
                    {fmt(d.calc.specController, { n: n(systemSpec.controllerWatt) })}
                  </p>
                </div>
              ) : null}
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <WhatsAppButton
                  label={d.calc.contactBtn}
                  href={whatsappUrl(
                    whatsapp,
                    customSystemInquiryMessage(load.totalWatt, hours, energy, {
                      batteryAh: systemSpec?.batteryAh,
                      panelWatt: systemSpec?.panelWatt,
                      controllerWatt: systemSpec?.controllerWatt,
                    }),
                  )}
                />
                <a
                  href={`tel:${phone}`}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-navy/20 px-6 text-sm font-bold text-navy hover:bg-white/60"
                >
                  {fmt(d.calc.callBtn, { n: phone })}
                </a>
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {load.totalWatt > 0 ? d.calc.waitHours : d.calc.waitDevices}
        </p>
      )}
      </>
      )}
    </div>
  );
}
