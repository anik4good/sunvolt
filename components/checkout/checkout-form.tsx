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

interface CheckoutFormProps {
  currency: string;
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

export function CheckoutForm({ currency }: CheckoutFormProps) {
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
        <p className="mt-4 text-lg font-semibold text-navy">কার্ট খালি</p>
        <p className="mt-1 text-sm text-muted-foreground">
          চেকআউট করতে অন্তত একটি প্যাকেজ কার্টে রাখুন।
        </p>
        <Button asChild className="mt-6 font-bold">
          <Link href="/packages">প্যাকেজ দেখুন</Link>
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
          <Label htmlFor="customerName">আপনার নাম *</Label>
          <Input
            id="customerName"
            name="customerName"
            required
            minLength={2}
            maxLength={80}
            placeholder="সম্পূর্ণ নাম"
            autoComplete="name"
          />
        </div>

        <div>
          <Label htmlFor="phone">মোবাইল নম্বর *</Label>
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
          <Label htmlFor="district">জেলা *</Label>
          <Input id="district" name="district" required placeholder="যেমন: ঢাকা" />
        </div>

        <div>
          <Label htmlFor="address">সম্পূর্ণ ঠিকানা *</Label>
          <Textarea
            id="address"
            name="address"
            required
            minLength={5}
            maxLength={250}
            placeholder="বাসা/হোল্ডিং, রোড, এলাকা"
            autoComplete="street-address"
          />
        </div>

        <div className="flex items-start gap-3 rounded-xl border p-4">
          <Checkbox id="installationRequired" name="installationRequired" className="mt-0.5 size-5" />
          <Label htmlFor="installationRequired" className="cursor-pointer font-normal">
            <span className="font-semibold text-navy">ইনস্টলেশন প্রয়োজন</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              ইনস্টলেশন চার্জ আলাদা — কল করে চূড়ান্ত চার্জ নিশ্চিত হোন
            </span>
          </Label>
        </div>

        <div>
          <Label htmlFor="notes">নোট (ঐচ্ছিক)</Label>
          <Textarea id="notes" name="notes" maxLength={500} placeholder="বিশেষ কিছু জানাতে চাইলে লিখুন" />
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
        <h2 className="font-bold text-navy">অর্ডার সামারি</h2>
        {!hydrated ? (
          <p className="mt-3 text-sm text-muted-foreground">লোড হচ্ছে…</p>
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
              <span className="font-bold text-navy">সাবটোটাল ({totalItems}টি)</span>
              <span className="text-xl font-extrabold text-navy">
                {formatPrice(subtotal, currency)}
                <span className="text-xs font-normal text-muted-foreground">/-</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              ইনস্টলেশন চার্জ আলাদা · ডেলিভারির আগে প্রতিনিধি কল করে অর্ডার নিশ্চিত করবেন
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
                  অপেক্ষা করুন…
                </>
              ) : (
                "অর্ডার নিশ্চিত করুন"
              )}
            </Button>
          </>
        )}

        {calc && calc.selections.length > 0 ? (
          <div className="mt-5 rounded-xl bg-solar-light/60 p-3 text-xs ring-1 ring-solar/40">
            <p className="font-bold text-navy">আপনার হিসাব (কার্টে যুক্ত)</p>
            <p className="mt-1 text-muted-foreground">
              মোট লোড: {calc.totalLoadWatt}W · ব্যাকআপ: {calc.backupHours ?? "—"} ঘণ্টা ·
              শক্তি: {calc.requiredEnergy}Wh
            </p>
          </div>
        ) : null}
      </aside>
    </form>
  );
}
