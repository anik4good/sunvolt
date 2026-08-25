import { cache } from "react";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appliances,
  orderAppliances,
  orderItems,
  orders,
  products,
  settings,
} from "@/db/schema";
import type { CalculationSettings } from "@/lib/solar/types";

/** Settings singleton — every page needs it, so dedupe per request. */
export const getSettings = cache(async () => {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);
  if (rows.length === 0) {
    throw new Error(
      "settings row is missing — run `npm run db:seed` to initialize",
    );
  }
  return rows[0];
});

export const getCalculationSettings = cache(
  async (): Promise<CalculationSettings> => {
    const s = await getSettings();
    return {
      batteryEfficiency: Number(s.batteryEfficiency),
      systemEfficiency: Number(s.systemEfficiency),
      recommendedReserve: Number(s.recommendedReserve),
    };
  },
);

export async function getActiveAppliances() {
  return db
    .select()
    .from(appliances)
    .where(eq(appliances.active, true))
    .orderBy(asc(appliances.name));
}

/** All active products — packages AND components (listings, checkout, sitemap). */
export async function getActiveProducts() {
  return db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(asc(products.batteryCapacityAh));
}

/**
 * Active backup packages only. The calculator and homepage package
 * sections use this — components must never be recommended as a
 * backup solution.
 */
export async function getBackupPackages() {
  return db
    .select()
    .from(products)
    .where(sql`${products.category} = 'package' and ${products.active} = true`)
    .orderBy(desc(products.featured), asc(products.batteryCapacityAh));
}

export async function getComponents() {
  return db
    .select()
    .from(products)
    .where(sql`${products.category} <> 'package' and ${products.active} = true`)
    .orderBy(asc(products.price));
}

export type ProductSort = "newest" | "price-asc" | "price-desc";

/** Catalog listing for /products with optional category / search / sort. */
export async function getProducts(opts: {
  category?: string;
  q?: string;
  sort?: ProductSort;
} = {}) {
  const conditions = [sql`${products.category} <> 'package'`, eq(products.active, true)];
  if (opts.category) {
    conditions.push(eq(products.category, opts.category));
  }
  if (opts.q) {
    const like = `%${opts.q.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${products.name}) like ${like} or lower(coalesce(${products.brand}, '')) like ${like})`,
    );
  }
  const order =
    opts.sort === "price-asc"
      ? asc(products.price)
      : opts.sort === "price-desc"
        ? desc(products.price)
        : desc(products.createdAt);

  return db
    .select()
    .from(products)
    .where(sql.join(conditions, sql` and `))
    .orderBy(order);
}

/** Active product count per category, for the /products sidebar. */
export async function getCategoryCounts() {
  const rows = await db
    .select({
      category: products.category,
      value: sql<number>`count(*)::int`,
    })
    .from(products)
    .where(sql`${products.category} <> 'package' and ${products.active} = true`)
    .groupBy(products.category);
  return new Map(rows.map((r) => [r.category, r.value]));
}

/** Same-category products for the detail page's related section. */
export async function getRelatedProducts(slug: string, category: string, limit = 4) {
  return db
    .select()
    .from(products)
    .where(
      sql`${products.category} = ${category} and ${products.slug} <> ${slug} and ${products.active} = true`,
    )
    .orderBy(asc(products.price))
    .limit(limit);
}

export async function getProductBySlug(slug: string) {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getOrderWithDetails(id: string) {
  const rows = await db
    .select({ order: orders, product: products })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.id, id))
    .limit(1);
  if (rows.length === 0) return null;
  const [items, applianceRows] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(orderAppliances).where(eq(orderAppliances.orderId, id)),
  ]);
  return { ...rows[0], items, appliances: applianceRows };
}
