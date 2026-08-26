"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  updateSettings,
  type AdminFormState,
} from "@/app/admin/(panel)/settings/actions";
import { parsePanelRates } from "@/lib/panel-rates";
import type { Settings } from "@/db/schema";

// Number of editable voltage → rate rows in the panel pricing section
const RATE_ROWS = 4;

export function SettingsForm({ settings }: { settings: Settings }) {
  const panelRates = parsePanelRates(settings.panelRates);
  const [tab, setTab] = useState<"business" | "calculator" | "pricing">("business");

  const tabs = [
    ["business", "Business"],
    ["calculator", "Calculator"],
    ["pricing", "Pricing & Cost"],
  ] as const;
  const [state, formAction, pending] = useActionState<AdminFormState | undefined, FormData>(
    updateSettings,
    undefined,
  );

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {/* Tab bar — sections stay mounted (hidden) so all fields submit together */}
      <div role="tablist" className="flex gap-1 border-b">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "border-solar font-semibold text-navy"
                : "border-transparent text-muted-foreground hover:text-navy"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div hidden={tab !== "business"} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Business name *</Label>
          <Input name="businessName" required defaultValue={settings.businessName} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Currency symbol *</Label>
          <Input name="currency" required maxLength={4} defaultValue={settings.currency} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label className="text-xs text-muted-foreground">Phone *</Label>
          <Input name="phone" required defaultValue={settings.phone} placeholder="01601744070" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">WhatsApp (international) *</Label>
          <Input name="whatsapp" required defaultValue={settings.whatsapp} placeholder="8801601744070" />
          <p className="mt-1 text-xs text-muted-foreground">
            Digits only, no “+”. Local 01601744070 → 8801601744070.
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Address</Label>
          <Input name="address" defaultValue={settings.address} placeholder="Showroom address" />
        </div>
      </div>

      </div>

      <div hidden={tab !== "calculator"} className="space-y-6">
      <div>
        <h2 className="text-sm font-bold text-navy">Calculation parameters</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          These feed the calculator&apos;s package matching. Battery efficiency is the usable
          fraction applied to package capacity; the others affect detailed estimates.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <Label className="text-xs text-muted-foreground">Battery efficiency (0.1–1) *</Label>
            <Input
              name="batteryEfficiency"
              type="number"
              step="0.001"
              min="0.1"
              max="1"
              required
              defaultValue={Number(settings.batteryEfficiency)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">System efficiency (0.1–1) *</Label>
            <Input
              name="systemEfficiency"
              type="number"
              step="0.001"
              min="0.1"
              max="1"
              required
              defaultValue={Number(settings.systemEfficiency)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Recommended reserve (0–1) *</Label>
            <Input
              name="recommendedReserve"
              type="number"
              step="0.001"
              min="0"
              max="1"
              required
              defaultValue={Number(settings.recommendedReserve)}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-navy">Custom system sizing</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Used when a customer&apos;s load exceeds every package — the calculator
          shows a battery / panel / controller spec built from these values.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <Label className="text-xs text-muted-foreground">System voltage (V) *</Label>
            <Input
              name="systemVoltage"
              type="number"
              step="0.1"
              min="1"
              required
              defaultValue={Number(settings.systemVoltage)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Panel output factor (0.1–1) *</Label>
            <Input
              name="panelOutputFactor"
              type="number"
              step="0.001"
              min="0.1"
              max="1"
              required
              defaultValue={Number(settings.panelOutputFactor)}
            />
            <p className="mt-1 text-xs text-muted-foreground">0.7 = panels deliver 70% of nameplate</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Peak sun hours / day *</Label>
            <Input
              name="peakSunHours"
              type="number"
              step="0.1"
              min="1"
              max="12"
              required
              defaultValue={Number(settings.peakSunHours)}
            />
          </div>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">Standard battery sizes (Ah, comma-separated) *</Label>
            <Input name="batterySizes" required defaultValue={settings.batterySizes} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Standard controller ratings (W, comma-separated) *</Label>
            <Input name="controllerSizes" required defaultValue={settings.controllerSizes} />
          </div>
        </div>
      </div>

      </div>

      <div hidden={tab !== "pricing"} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">USD → BDT rate *</Label>
            <Input
              name="usdToBdt"
              type="number"
              step="0.01"
              min="1"
              required
              defaultValue={Number(settings.usdToBdt)}
            />
            <p className="mt-1 text-xs text-muted-foreground">Converts supplier cost for the products margin column</p>
          </div>
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium">
          <Checkbox name="showMargin" defaultChecked={settings.showMargin} className="size-5" />
          Show cost &amp; margin column in the product list
        </label>

      <div>
        <h2 className="text-sm font-bold text-navy">Solar panel pricing</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Global selling rate per watt by panel system voltage. When a solar panel
          product has a voltage + wattage set, its price is auto-calculated as
          rate × watts on save — no need to price each panel by hand.
        </p>
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-xs font-medium text-muted-foreground">
            <span>Panel system voltage (V)</span>
            <span>Price per watt ({settings.currency})</span>
          </div>
          {Array.from({ length: RATE_ROWS }).map((_, i) => {
            const rate = panelRates[i];
            return (
              <div key={i} className="grid grid-cols-2 gap-3">
                <Input
                  name={`rateVolt${i}`}
                  type="number"
                  min={1}
                  step={1}
                  placeholder={i === 0 ? "12" : "—"}
                  defaultValue={rate?.volt ?? ""}
                />
                <Input
                  name={`ratePerW${i}`}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={i === 0 ? "30" : "—"}
                  defaultValue={rate?.perWatt ?? ""}
                />
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {state?.message ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="font-semibold">
          {pending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            <>
              <Save aria-hidden />
              Save settings
            </>
          )}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
