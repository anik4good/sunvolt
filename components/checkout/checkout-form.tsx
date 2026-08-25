"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/app/actions/orders";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/format";
import { fmt, num, type Dictionary, type Lang } from "@/lib/dictionaries";

interface CheckoutFormProps {
  currency: string;
  lang: Lang;
  d: Dictionary;
}

interface StoredCalculation {
  selections: {
    id: string | null;
    name: string;
    watt: number;
    quantity: number;
  }[];
  totalLoadWatt: number;
  backupHours: number | null;
  requiredEnergy: number;
  recommendedSlug?: string;
}

export function CheckoutForm({ currency, lang, d }: CheckoutFormProps) {
  const n = (v: number | string) => num(v, lang);
  const { items, hydrated, subtotal, totalItems } = useCart();
  const [state, formAction, pending] = useActionState(createOrder, undefined);
  const [calc, setCalc] = useState<StoredCalculation | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sunvolt:calculation");
      if (raw) setCalc(JSON.parse(raw));
    } catch {
      // ignore — checkout without calculator context
    }
  }, []);

  if (hydrated && items.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
        <ShoppingCart className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <p className="mt-4 text-lg font-semibold text-navy">{d.checkout.emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {d.checkout.emptySub}
        </p>
        <Button asChild className="mt-6 font-bold">
          <Link href="/packages">{d.checkout.viewPackages}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <input
        type="hidden"
        name="items"
        value={hydrated ? JSON.stringify(items.map((x) => ({ slug: x.slug, quantity: x.quantity }))) : "[]"}
      />
      <input type="hidden" name="calc" value={calc ? JSON.stringify(calc) : ""} />

      <div className="space-y-5">
        <div>
          <Label htmlFor="customerName">{d.checkout.name}</Label>
          <Input
            id="customerName"
            name="customerName"
            required
            minLength={2}
            maxLength={80}
            placeholder={d.checkout.namePh}
            autoComplete="name"
          />
        </div>

        <div>
          <Label htmlFor="phone">{d.checkout.phone}</Label>
          <Input
            id="phone"
            name="phone"
            required
            inputMode="tel"
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
          />
        </div>

        <div>
          <Label htmlFor="district">{d.checkout.district}</Label>
          <Input id="district" name="district" required placeholder={d.checkout.districtPh} />
        </div>

        <div>
          <Label htmlFor="address">{d.checkout.address}</Label>
          <Textarea
            id="address"
            name="address"
            required
            minLength={5}
            maxLength={250}
            placeholder={d.checkout.addressPh}
            autoComplete="street-address"
          />
        </div>

        <div className="flex items-start gap-3 rounded-xl border p-4">
          <Checkbox id="installationRequired" name="installationRequired" className="mt-0.5 size-5" />
          <Label htmlFor="installationRequired" className="cursor-pointer font-normal">
            <span className="font-semibold text-navy">{d.checkout.installation}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {d.checkout.installationSub}
            </span>
          </Label>
        </div>

        <div>
          <Label htmlFor="notes">{d.checkout.notes}</Label>
          <Textarea id="notes" name="notes" maxLength={500} placeholder={d.checkout.notesPh} />
        </div>

        {state?.message ? (
          <p className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive" role="alert">
            <AlertCircle className="size-4 shrink-0" aria-hidden />
            {state.message}
          </p>
        ) : null}
      </div>

      {/* Order summary */}
      <aside className="h-fit rounded-2xl border bg-card p-5 lg:sticky lg:top-24">
        <h2 className="font-bold text-navy">{d.checkout.summary}</h2>
        {!hydrated ? (
          <p className="mt-3 text-sm text-muted-foreground">{d.cart.loading}</p>
        ) : (
          <>
            <ul className="mt-3 space-y-3 text-sm">
              {items.map((item) => (
                <li key={item.slug} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="shrink-0 font-semibold text-navy">
                    {formatPrice(item.price * item.quantity, currency)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="font-bold text-navy">{fmt(d.checkout.subtotalN, { n: n(totalItems) })}</span>
              <span className="text-xl font-extrabold text-navy">
                {formatPrice(subtotal, currency)}
                <span className="text-xs font-normal text-muted-foreground">/-</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {d.checkout.note}
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={pending || items.length === 0}
              className="mt-5 h-14 w-full text-base font-bold"
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  {d.checkout.waiting}
                </>
              ) : (
                "{d.checkout.submit}"
              )}
            </Button>
          </>
        )}

        {calc && calc.selections.length > 0 ? (
          <div className="mt-5 rounded-xl bg-solar-light/60 p-3 text-xs ring-1 ring-solar/40">
            <p className="font-bold text-navy">{d.checkout.calcAttached}</p>
            <p className="mt-1 text-muted-foreground">
              {fmt(d.checkout.calcLine, { w: calc.totalLoadWatt, h: calc.backupHours ?? "—", e: calc.requiredEnergy })}
            </p>
          </div>
        ) : null}
      </aside>
    </form>
  );
}
