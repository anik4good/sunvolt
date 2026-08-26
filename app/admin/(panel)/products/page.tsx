import Link from "next/link";
import Image from "next/image";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import { getSettings } from "@/lib/queries";
import { ProductsFilters } from "@/components/admin/products-filters";
import {
  deleteProduct,
  toggleProductActive,
  toggleProductFeatured,
} from "./actions";
import { DeleteButton } from "@/components/admin/delete-button";

export const metadata = { title: "Products | SunVolt Admin" };

const CATEGORIES = ["package", "solar-inverter", "bms", "solar-panel", "inverter", "diy-solar", "mppt-charger", "dc-charger", "accessories", "battery"] as const;

interface PageProps {
  searchParams: Promise<{
    saved?: string;
    deleted?: string;
    q?: string;
    category?: string;
    status?: string;
  }>;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge variant="outline" className="border-destructive text-destructive">Out of stock</Badge>;
  }
  if (stock < 5) {
    return <Badge variant="outline" className="border-solar text-solar-dark">Low · {stock}</Badge>;
  }
  return <Badge variant="outline" className="border-leaf text-leaf">In stock · {stock}</Badge>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { saved, deleted, q, category, status } = await searchParams;

  const conditions: SQL[] = [];
  if (q) {
    const like = `%${q.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${products.name}) like ${like} or lower(coalesce(${products.nameBn}, '')) like ${like} or lower(coalesce(${products.brand}, '')) like ${like} or lower(coalesce(${products.model}, '')) like ${like} or lower(${products.slug}) like ${like})`,
    );
  }
  if (category && (CATEGORIES as readonly string[]).includes(category)) {
    conditions.push(eq(products.category, category));
  }
  if (status === "active" || status === "disabled") {
    conditions.push(eq(products.active, status === "active"));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows, settings] = await Promise.all([
    db.select().from(products).where(where).orderBy(desc(products.updatedAt)).limit(200),
    db.select({ value: sql<number>`count(*)::int` }).from(products).where(where),
    getSettings(),
  ]);
  const total = countRows[0]?.value ?? 0;
  const usdRate = Number(settings.usdToBdt);
  const filtering = Boolean(q || (category && category !== "all") || (status && status !== "all"));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"}
            {filtering ? " matching your filters" : ""} — packages and components.
          </p>
        </div>
        <Button asChild className="font-semibold">
          <Link href="/admin/products/new">
            <Plus aria-hidden />
            New Product
          </Link>
        </Button>
      </div>

      {saved ? (
        <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">Product saved.</p>
      ) : null}
      {deleted ? (
        <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">Product deleted.</p>
      ) : null}

      {/* key resets the search box when the URL's q changes (e.g. Clear filters) */}
      <ProductsFilters key={q ?? ""} />

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              {settings.showMargin ? (
                <th className="px-4 py-3">Cost / Margin</th>
              ) : null}
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={settings.showMargin ? 8 : 7} className="px-4 py-10 text-center text-muted-foreground">
                  {filtering ? (
                    <>
                      No products match your filters.{" "}
                      <Link href="/admin/products" className="font-semibold text-navy hover:underline">
                        Clear filters
                      </Link>
                    </>
                  ) : (
                    "No products yet — create your first one."
                  )}
                </td>
              </tr>
            ) : (
              rows.map((product) => (
                <tr key={product.id} className="border-t align-middle hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="size-11 shrink-0 overflow-hidden rounded-lg border bg-white"
                      >
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt=""
                            width={88}
                            height={88}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-lg" aria-hidden>
                            ⚡
                          </span>
                        )}
                      </Link>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="truncate font-semibold text-navy hover:underline"
                          >
                            {product.name}
                          </Link>
                          <form action={toggleProductFeatured.bind(null, product.id, !product.featured)}>
                            <button
                              type="submit"
                              className={product.featured ? "text-solar-dark hover:opacity-70" : "text-muted-foreground/40 hover:text-solar-dark"}
                              title={product.featured ? "Unset featured" : "Set featured"}
                              aria-label={product.featured ? `Unset ${product.name} as featured` : `Set ${product.name} as featured`}
                            >
                              <Star className={`size-4 ${product.featured ? "fill-current" : ""}`} aria-hidden />
                            </button>
                          </form>
                        </div>
                        <span className="block truncate text-xs text-muted-foreground">
                          /{product.slug}
                          {product.brand ? ` · ${product.brand}` : ""}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={product.category === "package" ? "border-solar text-solar-dark" : "border-navy/30 text-navy"}
                    >
                      {product.category === "package" ? "Package" : categoryLabel(product.category)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-navy">{formatPrice(product.price)}</span>
                    {product.discountPct > 0 ? (
                      <span className="ml-1.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                        −{product.discountPct}%
                      </span>
                    ) : null}
                  </td>
                  {settings.showMargin ? (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {product.costPrice?.ladder?.[0] ? (
                      <span title={`MOQ ${product.costPrice.moq} pcs · ${product.costPrice.ladder.map((l) => `${l.qtyMin}${l.qtyMax ? `-${l.qtyMax}` : "+"}=$${l.priceUsd}`).join(" · ")}`}>
                        <span className="text-muted-foreground">
                          ${product.costPrice.ladder[0].priceUsd} (৳
                          {Math.round(product.costPrice.ladder[0].priceUsd * usdRate).toLocaleString()})
                        </span>{" "}
                        <span className="font-semibold text-leaf">
                          +{formatPrice(Math.round(Number(product.price) - product.costPrice.ladder[0].priceUsd * usdRate))}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  ) : null}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StockBadge stock={product.stock} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={product.active ? "border-leaf text-leaf" : "border-muted-foreground text-muted-foreground"}
                    >
                      {product.active ? "active" : "disabled"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {product.updatedAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleProductActive.bind(null, product.id, !product.active)}>
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          aria-label={product.active ? `Disable ${product.name}` : `Enable ${product.name}`}
                          title={product.active ? "Hide from website" : "Show on website"}
                        >
                          {product.active ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                          {product.active ? "Disable" : "Enable"}
                        </Button>
                      </form>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/products/${product.id}`}>
                          <Pencil aria-hidden />
                          Edit
                        </Link>
                      </Button>
                      <DeleteButton
                        label="Delete"
                        confirmText={`Delete "${product.name}"? This cannot be undone.`}
                        action={deleteProduct}
                        id={product.id}
                        className="h-8 px-3 text-destructive"
                        icon={<Trash2 className="size-4" aria-hidden />}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
