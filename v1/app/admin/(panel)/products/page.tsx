import Link from "next/link";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSettings } from "@/lib/queries";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductsFilters } from "@/components/admin/products-filters";
import { ProductsDataTable } from "@/components/admin/products-data-table";
import { getCategories } from "@/lib/queries";

export const metadata = { title: "Products | SunVolt Admin" };

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
  const categories = await getCategories();
  const activeCategories = categories.filter((c) => c.active);
  const categoryLabels: Record<string, string> = {
    package: "Package",
    ...Object.fromEntries(categories.map((c) => [c.slug, c.label])),
  };

  const conditions: SQL[] = [];
  if (q) {
    const like = `%${q.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${products.name}) like ${like} or lower(coalesce(${products.nameBn}, '')) like ${like} or lower(coalesce(${products.brand}, '')) like ${like} or lower(coalesce(${products.model}, '')) like ${like} or lower(${products.slug}) like ${like})`,
    );
  }
  if (category && ["package", ...activeCategories.map((c) => c.slug)].includes(category)) {
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
      <AdminPageHeader
        title="Products"
        description={
          `${total} ${total === 1 ? "product" : "products"}${filtering ? " matching your filters" : ""} — packages and components.`
        }
        actions={
          <Button asChild className="font-semibold">
            <Link href="/admin/products/new">
              <Plus aria-hidden />
              New Product
            </Link>
          </Button>
        }
      />

      {saved ? (
        <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">Product saved.</p>
      ) : null}
      {deleted ? (
        <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">Product deleted.</p>
      ) : null}

      {/* key resets the search box when the URL's q changes (e.g. Clear filters) */}
      <ProductsFilters
        key={q ?? ""}
        categories={activeCategories.map((c) => ({ slug: c.slug, label: c.label }))}
      />

      <div>
        {rows.length === 0 ? (
          <Card className="items-center justify-center px-4 py-10 text-center text-muted-foreground">
            {filtering ? (
              <>
                No products match your filters.{" "}
                <Link href="/admin/products" className="font-semibold hover:underline">
                  Clear filters
                </Link>
              </>
            ) : (
              "No products yet — create your first one."
            )}
          </Card>
        ) : (
          <ProductsDataTable
            data={rows}
            showMargin={showMargin}
            usdRate={usdRate}
            categoryLabels={categoryLabels}
          />
        )}
      </div>
    </div>
  );
}
