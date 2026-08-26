import Link from "next/link";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getSettings } from "@/lib/queries";
import { ProductsFilters } from "@/components/admin/products-filters";
import { ProductsDataTable } from "@/components/admin/products-data-table";

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
  const showMargin = settings.showMargin ?? false;

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

      <div>
        {rows.length === 0 ? (
          <div className="rounded-xl border bg-card px-4 py-10 text-center text-muted-foreground">
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
          </div>
        ) : (
          <ProductsDataTable data={rows} showMargin={showMargin} usdRate={usdRate} />
        )}
      </div>
    </div>
  );
}
