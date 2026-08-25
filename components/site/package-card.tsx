import Link from "next/link";
import { BatteryCharging } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { Product } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { fmt, num, type Dictionary, type Lang } from "@/lib/i18n";

interface PackageCardProps {
  product: Product;
  currency: string;
  featured?: boolean;
  lang: Lang;
  d: Dictionary;
}

/** Card for backup combo packages (/packages). Products use ProductCard. */
export function PackageCard({ product, currency, featured, lang, d }: PackageCardProps) {
  const displayName = product.nameBn ?? product.name;

  return (
    <Card
      className={
        featured
          ? // overflow-visible lets the best-seller badge render above the card border
            "relative flex flex-col overflow-visible border-solar/60 shadow-md ring-1 ring-solar/40"
          : "relative flex flex-col"
      }
    >
      {featured ? (
        <Badge className="absolute -top-3 left-4 z-10 bg-solar font-semibold text-navy">
          {d.pkgCard.bestSeller}
        </Badge>
      ) : null}

      <CardContent className="flex flex-1 flex-col px-5 pt-5">
        <div className="flex items-start justify-between gap-2">
          {/* Fixed title height keeps every card aligned regardless of name length */}
          <div className="min-h-[3.6rem]">
            <h3 className="text-lg font-bold leading-snug text-navy">{displayName}</h3>
            <p className="mt-1 text-sm font-semibold text-navy">
              {fmt(d.pkgCard.backupMax, { n: num(product.backupHours ?? 0, lang) })}
            </p>
          </div>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-solar-light text-solar-dark">
            <BatteryCharging className="size-6" aria-hidden />
          </span>
        </div>

        {/* What it can run — customer language, not amp-hours */}
        <div className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {d.pkgCard.example}
          </p>
          <p className="mt-1 font-medium text-navy">
            {fmt(d.pkgCard.exampleLine, {
              f: num(product.exampleFanCount ?? 2, lang),
              l: num(product.exampleLightCount ?? 1, lang),
            })}
          </p>
        </div>

        {/* Included components — visible directly, no click needed */}
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          {product.solarPanelWatt ? (
            <li>☀️ {product.solarPanelWatt}W Solar Panel</li>
          ) : null}
          <li>
            🔋 {product.batteryVoltage ?? 0}V {product.batteryCapacityAh ?? 0}Ah{" "}
            {product.batteryType ?? ""} Battery
          </li>
          {product.controllerWatt ? (
            <li>⚡ {product.controllerWatt}W Charge Controller</li>
          ) : null}
        </ul>

        <div className="mt-auto pt-4">
          <p className="text-2xl font-extrabold text-navy">
            {formatPrice(product.price, currency)}
            <span className="text-xs font-normal text-muted-foreground">/-</span>
          </p>
          <p className="text-xs text-muted-foreground">{d.pkgCard.installNote}</p>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <AddToCartButton
          className="flex-1"
          label={d.pkgCard.addToCart}
          addedLabel={d.pkgCard.added}
          item={{
            slug: product.slug,
            name: displayName,
            battery: `${product.batteryVoltage ?? 0}V ${product.batteryCapacityAh ?? 0}Ah ${product.batteryType ?? ""}`.trim(),
            price: Number(product.price),
          }}
        />
        <Button asChild variant="outline" className="flex-1">
          <Link href={`/packages/${product.slug}`}>{d.pkgCard.details}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
