"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveAppliance,
  type AdminFormState,
} from "@/app/admin/(panel)/appliances/actions";
import type { Appliance } from "@/db/schema";

export function ApplianceForm({ appliance }: { appliance?: Appliance }) {
  const [state, formAction, pending] = useActionState<AdminFormState | undefined, FormData>(
    (prev, formData) => saveAppliance(appliance?.id ?? null, prev, formData),
    undefined,
  );

  return (
    <form action={formAction} className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Name *</Label>
          <Input name="name" required defaultValue={appliance?.name} placeholder="DC Fan" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Category *</Label>
          <Input
            name="category"
            required
            defaultValue={appliance?.category ?? "general"}
            placeholder="cooling / lighting / entertainment"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Default wattage (W) *</Label>
          <Input
            name="defaultWatt"
            type="number"
            min={1}
            max={2000}
            required
            defaultValue={appliance?.defaultWatt}
            placeholder="17"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Used by the calculator — if the real product changes to 18W, update it here.
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Icon (emoji) *</Label>
          <Input name="icon" required maxLength={4} defaultValue={appliance?.icon ?? "🔌"} placeholder="🌀" />
        </div>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium">
        <Checkbox name="active" defaultChecked={appliance?.active ?? true} className="size-5" />
        Active (shown in the calculator)
      </label>

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
              {appliance ? "Save changes" : "Create appliance"}
            </>
          )}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/appliances">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
