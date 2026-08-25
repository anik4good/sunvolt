"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
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
import { useCart } from "@/components/cart/cart-provider";
import {
  calculateBatteryRequirement,
  calculateEnergyRequirement,
  calculateTotalLoad,
  recommendPackage,
} from "@/lib/solar";
import type {
  ApplianceInput,
  CalculationSettings,
  PackageLike,
} from "@/lib/solar/types";
import { formatPrice } from "@/lib/format";
import { customSystemInquiryMessage, whatsappUrl } from "@/lib/whatsapp";

interface ApplianceOption {
  id: string;
  name: string;
  defaultWatt: number;
  icon: string;
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
}

const HOUR_PRESETS = [3, 6, 12];
/** Standard SunVolt package voltage, used for the detailed battery estimate. */
const STANDARD_VOLTAGE = 12;

export function CalculatorClient({
  appliances,
  packages,
  currency,
  phone,
  whatsapp,
  calcSettings,
}: CalculatorClientProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [backupHours, setBackupHours] = useState<number | null>(null);
  const [customHours, setCustomHours] = useState("");

  // Continue where the homepage mini-calculator left off, if the user
  // tapped "বিস্তারিত হিসাব দেখুন" there.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sunvolt:home-calc");
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        quantities?: Record<string, number>;
        backupHours?: number | null;
      };
      if (draft.quantities) setQuantities(draft.quantities);
      if (typeof draft.backupHours === "number") setBackupHours(draft.backupHours);
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
      ...appliances
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
    [appliances, quantities, customItems],
  );

  const load = useMemo(() => calculateTotalLoad(selected), [selected]);
  const hours = backupHours;
  const energy = hours !== null && load.totalWatt > 0
    ? calculateEnergyRequirement(load.totalWatt, hours)
    : 0;

  const recommendation = useMemo(() => {
    if (hours === null || load.totalWatt <= 0 || energy <= 0) return null;
    return recommendPackage(packages, load.totalWatt, energy, calcSettings);
  }, [packages, load.totalWatt, hours, energy, calcSettings]);

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
      setDeviceError("ডিভাইসের নাম লিখুন");
      return;
    }
    if (!Number.isFinite(watt) || watt < 1 || watt > 2000) {
      setDeviceError("সঠিক ওয়াটেজ লিখুন (১–২০০০W)");
      return;
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      setDeviceError("সংখ্যা ১ থেকে ২০ এর মধ্যে হতে হবে");
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-navy">
          স্মার্ট ব্যাকআপ হিসাব
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
          কী চালাতে চান আর কতক্ষণ — শুধু বলুন। বাকিটা SunVolt হিসাব করবে।
        </p>
      </header>

      {/* Step 1 — appliances */}
      <section className="mt-10" aria-labelledby="step-appliances">
        <h2 id="step-appliances" className="flex items-center gap-2 text-xl font-bold text-navy">
          <span className="flex size-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-solar">
            ১
          </span>
          আপনি কী কী চালাতে চান?
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {appliances.map((appliance) => {
            const qty = quantities[appliance.id] ?? 0;
            return (
              <Card
                key={appliance.id}
                className={qty > 0 ? "border-navy/50 ring-1 ring-navy/30" : ""}
              >
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <span className="text-3xl" aria-hidden>{appliance.icon}</span>
                  <p className="mt-2 text-sm font-semibold text-navy">
                    {appliance.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {appliance.defaultWatt}W
                  </p>
                  {qty > 0 ? (
                    <p className="mt-1 text-xs font-medium text-leaf">
                      {appliance.defaultWatt}W × {qty} ={" "}
                      {appliance.defaultWatt * qty}W
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-10"
                      aria-label={`${appliance.name} কমান`}
                      disabled={qty === 0}
                      onClick={() => changeQuantity(appliance.id, -1)}
                    >
                      <Minus aria-hidden />
                    </Button>
                    <span className="w-8 text-center text-lg font-bold text-navy" aria-live="polite">
                      {qty}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      className="size-10"
                      aria-label={`${appliance.name} বাড়ান`}
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
            <p className="text-sm font-semibold text-navy">
              অন্য কিছু চালাতে চান? নিজে যোগ করুন
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <div>
                <Label htmlFor="device-name" className="text-xs text-muted-foreground">
                  ডিভাইসের নাম
                </Label>
                <Input
                  id="device-name"
                  placeholder="যেমন: Small TV"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="device-watt" className="text-xs text-muted-foreground">
                  ওয়াট (W)
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
                  সংখ্যা
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
                  যোগ করুন
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
                      🔌 {item.name} — {item.watt}W × {item.quantity} ={" "}
                      {item.watt * item.quantity}W
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label={`${item.name} মুছুন`}
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
          <p className="text-sm text-white/70">মোট লোড</p>
          <p className="mt-1 text-4xl font-extrabold" aria-live="polite">
            {load.totalWatt}
            <span className="text-xl font-bold">W</span>
          </p>
          {load.lines.length > 0 ? (
            <div className="mt-3 text-xs text-white/70">
              {load.lines
                .map((l) => `${l.quantity} × ${l.name} (${l.watt}W × ${l.quantity} = ${l.totalWatt}W)`)
                .join(" + ")}
            </div>
          ) : (
            <p className="mt-2 text-xs text-white/60">
              উপরের কার্ড থেকে ডিভাইস নির্বাচন করুন
            </p>
          )}
        </div>
      </section>

      {/* Step 2 — backup hours */}
      <section className="mt-10" aria-labelledby="step-hours">
        <h2 id="step-hours" className="flex items-center gap-2 text-xl font-bold text-navy">
          <span className="flex size-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-solar">
            ২
          </span>
          কত ঘণ্টা ব্যাকআপ প্রয়োজন?
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
              {preset} ঘণ্টা
            </button>
          ))}
        </div>

        <div className="mt-4 flex max-w-xs items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="custom-hours" className="text-xs text-muted-foreground">
              নিজের সময় নির্বাচন করুন (১–৪৮ ঘণ্টা)
            </Label>
            <Input
              id="custom-hours"
              type="number"
              inputMode="numeric"
              min={1}
              max={48}
              placeholder="যেমন: 8"
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
            <p className="text-sm font-semibold text-navy">আপনার প্রয়োজনীয় শক্তি</p>
            <p className="mt-2 text-5xl font-extrabold text-navy" aria-live="polite">
              {energy}
              <span className="text-2xl">Wh</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {load.totalWatt}W × {hours} ঘণ্টা = {energy}Wh
            </p>

            <Accordion type="single" collapsible className="mt-4 text-left">
              <AccordionItem value="details" className="border-none">
                <AccordionTrigger className="justify-center rounded-xl bg-white/70 px-4 py-3 text-sm font-semibold text-navy hover:no-underline">
                  বিস্তারিত হিসাব দেখুন
                </AccordionTrigger>
                <AccordionContent className="rounded-xl bg-white/70 px-4 pb-4 text-sm">
                  <ul className="space-y-1">
                    {load.lines.map((line, i) => (
                      <li key={i} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          {line.quantity} × {line.name}
                        </span>
                        <span className="font-medium">
                          {line.watt}W × {line.quantity} = {line.totalWatt}W
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 border-t pt-3">
                    <p className="flex justify-between font-semibold text-navy">
                      <span>মোট লোড</span>
                      <span>{load.totalWatt}W</span>
                    </p>
                    <p className="mt-1 flex justify-between">
                      <span className="text-muted-foreground">
                        প্রয়োজনীয় শক্তি ({load.totalWatt}W × {hours} ঘণ্টা)
                      </span>
                      <span className="font-medium">{energy}Wh</span>
                    </p>
                    {batteryEstimate ? (
                      <p className="mt-1 flex justify-between">
                        <span className="text-muted-foreground">
                          আনুমানিক ব্যাটারি ({matchedProduct?.batteryVoltage ?? STANDARD_VOLTAGE}V)
                        </span>
                        <span className="font-medium">
                          ≈ {batteryEstimate.requiredAh}Ah
                        </span>
                      </p>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Recommendation */}
          {matchedProduct ? (
            <div className="mt-8">
              <h2 id="result-heading" className="text-center text-xl font-bold text-navy">
                আপনার জন্য উপযুক্ত প্যাকেজ
              </h2>
              <Card className="mt-4 border-leaf/50 ring-1 ring-leaf/30">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-extrabold text-navy">
                      {matchedProduct.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      প্রায় {matchedProduct.backupHours} ঘণ্টা ব্যাকআপ*
                    </p>
                  </div>

                  <ul className="mx-auto mt-4 max-w-xs space-y-2 text-sm">
                    {matchedProduct.solarPanelWatt ? (
                      <li>☀️ {matchedProduct.solarPanelWatt}W Solar Panel</li>
                    ) : null}
                    {matchedProduct.controllerWatt ? (
                      <li>⚡ {matchedProduct.controllerWatt}W Solar Controller</li>
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
                    ইনস্টলেশন চার্জ আলাদা
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      size="lg"
                      className="h-13 flex-1 text-base font-bold"
                      onClick={() => goToOrder(matchedProduct)}
                    >
                      অর্ডার করুন
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
                <h3 className="font-bold text-navy">
                  কেন এই প্যাকেজটি আপনার জন্য উপযুক্ত?
                </h3>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>আপনার মোট লোড: {load.totalWatt}W</p>
                  <p>প্রয়োজনীয় ব্যাকআপ: {hours} ঘণ্টা</p>
                  <p>প্রয়োজনীয় শক্তি: {energy}Wh</p>
                  <p className="pt-2 font-medium text-navy">
                    {matchedProduct.name} আপনার প্রয়োজন অনুযায়ী নির্বাচন করা
                    হয়েছে।
                  </p>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  *ব্যাকআপ সময় লোডের ধরন, ব্যবহার পদ্ধতি, ব্যাটারির অবস্থা ও
                  অন্যান্য পরিস্থিতির উপর নির্ভরশীল।
                </p>
              </div>
            </div>
          ) : recommendation?.status === "none" ? (
            <div className="mt-8 rounded-3xl border border-solar/50 bg-solar-light/50 p-6 text-center">
              <p className="text-lg font-bold text-navy">
                আপনার প্রয়োজনীয় লোড স্ট্যান্ডার্ড প্যাকেজের চেয়ে বেশি।
              </p>
              <p className="mt-2 text-muted-foreground">
                আপনার জন্য কাস্টম সোলার সিস্টেম প্রয়োজন।
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <WhatsAppButton
                  label="SunVolt-এর সাথে যোগাযোগ করুন"
                  href={whatsappUrl(
                    whatsapp,
                    customSystemInquiryMessage(load.totalWatt, hours, energy),
                  )}
                />
                <a
                  href={`tel:${phone}`}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-navy/20 px-6 text-sm font-bold text-navy hover:bg-white/60"
                >
                  📞 কল করুন: {phone}
                </a>
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {load.totalWatt > 0
            ? "ব্যাকআপ সময় নির্বাচন করলে আপনার প্রয়োজনীয় শক্তি ও উপযুক্ত প্যাকেজ দেখাবে।"
            : "ডিভাইস নির্বাচন করলে মোট লোড দেখাবে।"}
        </p>
      )}
    </div>
  );
}
