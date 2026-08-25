"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, hydrated, setQuantity, removeItem, subtotal, totalItems } =
    useCart();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-navy">আপনার কার্ট</h1>

      {!hydrated ? (
        <p className="mt-10 text-center text-muted-foreground">লোড হচ্ছে…</p>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
          <ShoppingCart className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-4 text-lg font-semibold text-navy">কার্ট খালি</p>
          <p className="mt-1 text-sm text-muted-foreground">
            প্যাকেজ দেখে কার্টে যোগ করুন, অথবা হিসাব করে উপযুক্ত প্যাকেজ বেছে নিন।
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="font-bold">
              <Link href="/packages">প্যাকেজ দেখুন</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/calculator">ব্যাকআপ হিসাব করুন</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.slug}>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <span
                      className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-solar-light text-2xl"
                      aria-hidden
                    >
                      🔋
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/packages/${item.slug}`}
                        className="block truncate font-bold text-navy hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.battery}</p>
                      <p className="mt-1 text-sm font-semibold text-navy">
                        {formatPrice(item.price)} × {item.quantity} ={" "}
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-9"
                          aria-label={`${item.name} কমান`}
                          disabled={item.quantity <= 1}
                          onClick={() => setQuantity(item.slug, item.quantity - 1)}
                        >
                          <Minus aria-hidden />
                        </Button>
                        <span className="w-7 text-center text-lg font-bold text-navy">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          className="size-9"
                          aria-label={`${item.name} বাড়ান`}
                          disabled={item.quantity >= 10}
                          onClick={() => setQuantity(item.slug, item.quantity + 1)}
                        >
                          <Plus aria-hidden />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.slug)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        সরান
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl border bg-card p-5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>মোট আইটেম</span>
              <span className="font-medium text-navy">{totalItems}টি</span>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">সাবটোটাল</span>
              <span className="text-2xl font-extrabold text-navy">
                {formatPrice(subtotal)}
                <span className="text-sm font-normal text-muted-foreground">/-</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              ইনস্টলেশন চার্জ আলাদা · ডেলিভারির আগে আমাদের প্রতিনিধি কল করে
              অর্ডার নিশ্চিত করবেন
            </p>
            <Button asChild size="lg" className="mt-5 h-14 w-full text-base font-bold">
              <Link href="/checkout">চেকআউট করুন</Link>
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full">
              <Link href="/packages">আরও প্যাকেজ দেখুন</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
