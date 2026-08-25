"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateSettings,
  type AdminFormState,
} from "@/app/admin/(panel)/settings/actions";
import type { Settings } from "@/db/schema";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState<AdminFormState | undefined, FormData>(
    updateSettings,
    undefined,
  );

  return (
    <form action={formAction} className="mt-6 space-y-6">
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

      <div>
        <h2 className="text-sm font-bold text-navy">Calculation parameters</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          These feed the calculator's package matching. Battery efficiency is the usable
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
