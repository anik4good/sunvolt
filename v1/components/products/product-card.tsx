import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { Product } from "@/db/schema";
import { categoryLabel as fallbackCategoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import { fmt, type Dictionary } from "@/lib/i18n";

export function ProductCard({
  product,
  currency,
  d,
  categoryLabel,
}: {
  product: Product;
  currency: string;
  d: Dictionary;
  /** Resolved category label from the DB — falls back to the slug. */
  categoryLabel?: string;
}) {
  const label = categoryLabel ?? fallbackCategoryLabel(product.category);
  const original =
    product.discountPct > 0
      ? Math.round(Number(product.price) / (1 - product.discountPct / 100))
      : null;

  return (
    <Card className="group relative flex flex-col p-0">
      {product.discountPct > 0 ? (
        <Badge className="absolute left-2 top-2 z-10 bg-destructive text-white">
          −{product.discountPct}%
        </Badge>
      ) : null}
      {product.stock === 0 ? (
        <Badge className="absolute right-2 top-2 z-10 bg-muted text-muted-foreground">
          {d.products.outOfStock}
        </Badge>
      ) : null}

      <Link
        href={`/products/${product.slug}`}
        className="relative block overflow-hidden rounded-t-xl border-b bg-white"
      >
        <div className="relative aspect-square">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-4 transition-transform group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-4xl" aria-hidden>
              ⚡
            </span>
          )}
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col px-4 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Link href={`/products/${product.slug}`} className="mt-1">
          <h3 className="line-clamp-2 min-h-11 text-sm font-semibold text-navy hover:underline">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-xs font-medium">
          {product.stock > 0 ? (
            <span className="text-leaf">{d.products.inStock}</span>
          ) : (
            <span className="text-muted-foreground">{d.products.outOfStock}</span>
          )}
        </p>
        <p className="mt-auto pt-3">
          <span className="text-lg font-extrabold text-navy">
            {formatPrice(product.price, currency)}
          </span>
          {original ? (
            <span className="ml-2 text-sm text-muted-foreground line-through">
              {formatPrice(original, currency)}
            </span>
          ) : null}
        </p>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        <AddToCartButton
          className="w-full"
          label={d.products.addToCart}
          addedLabel={d.products.added}
          item={{
            slug: product.slug,
            name: product.name,
            battery: [product.brand, product.model].filter(Boolean).join(" · ") || label,
            price: Number(product.price),
          }}
        />
      </CardFooter>
    </Card>
  );
}
