"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Calculator, Menu, Phone, ShoppingCart, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/components/cart/cart-provider";

const NAV_ITEMS = [
  { href: "/", label: "হোম" },
  { href: "/packages", label: "প্যাকেজ" },
  { href: "/products", label: "Products" },
  { href: "/calculator", label: "ব্যাকআপ হিসাব" },
  { href: "/contact", label: "যোগাযোগ" },
] as const;

interface HeaderProps {
  businessName: string;
  phone: string;
  whatsapp: string;
}

export function Header({ businessName, phone }: HeaderProps) {
  const pathname = usePathname();
  const { totalItems, hydrated } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="SunVolt হোম">
          <Image
            src="/logo.png"
            alt={`${businessName} লোগো`}
            width={140}
            height={40}
            priority
            className="h-9 w-auto"
          />
          <span className="sr-only">{businessName}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="মূল মেনু">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-secondary text-navy"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-navy"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden font-semibold sm:inline-flex">
            <Link href="/calculator">
              <Calculator aria-hidden />
              হিসাব করুন
            </Link>
          </Button>

          <Link
            href="/cart"
            aria-label={`কার্ট${hydrated && totalItems > 0 ? ` (${totalItems}টি আইটেম)` : ""}`}
            className="relative flex size-10 items-center justify-center rounded-xl border bg-background text-navy transition-colors hover:bg-secondary"
          >
            <ShoppingCart className="size-5" aria-hidden />
            {hydrated && totalItems > 0 ? (
              <span
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-solar text-xs font-bold text-navy"
                aria-hidden
              >
                {totalItems}
              </span>
            ) : null}
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="মেনু খুলুন"
              >
                <Menu aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-navy">
                  <Sun className="size-5 text-solar" aria-hidden />
                  {businessName}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="মোবাইল মেনু">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-3 text-base font-medium text-navy hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/cart"
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-navy hover:bg-secondary"
                >
                  কার্ট
                  {hydrated && totalItems > 0 ? (
                    <span className="flex size-6 items-center justify-center rounded-full bg-solar text-xs font-bold text-navy">
                      {totalItems}
                    </span>
                  ) : (
                    <ShoppingCart className="size-4" aria-hidden />
                  )}
                </Link>
                <Button asChild className="mt-3 font-semibold">
                  <Link href="/calculator">
                    <Calculator aria-hidden />
                    ব্যাকআপ হিসাব করুন
                  </Link>
                </Button>
                <Button asChild variant="outline" className="mt-2">
                  <a href={`tel:${phone}`}>
                    <Phone aria-hidden />
                    কল করুন: {phone}
                  </a>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
