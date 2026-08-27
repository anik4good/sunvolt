import { cache } from "react";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appliances,
  categories,
  invoiceItems,
  invoices,
  orderAppliances,
  orderItems,
  orders,
  products,
  settings,
  type Category,
} from "@/db/schema";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import type { CalculationSettings } from "@/lib/solar/types";

/**
 * Product categories from Admin → Categories, ordered by sort position.
 * Falls back to the built-in list when the table is empty (fresh installs
 * before seeding) so the site never renders without category labels.
 */
export const getCategories = cache(async (): Promise<Category[]> => {
  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.label));
  if (rows.length > 0) return rows;
  return PRODUCT_CATEGORIES.map((c, i) => ({
    id: c.slug,
    slug: c.slug,
    label: c.label,
    labelBn: c.labelBn,
    icon: c.icon,
    active: true,
    sortOrder: i,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
});

/** Mutation-time category check (sees rows created after boot). */
export async function isValidCategorySlug(slug: string): Promise<boolean> {
  const rows = await db
    .select({ slug: categories.slug })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (rows.length > 0) return true;
  return PRODUCT_CATEGORIES.some((c) => c.slug === slug);
}

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
      systemVoltage: Number(s.systemVoltage),
      panelOutputFactor: Number(s.panelOutputFactor),
      peakSunHours: Number(s.peakSunHours),
      batterySizes: s.batterySizes,
      controllerSizes: s.controllerSizes,
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

/**
 * Curated products for the homepage showcase: admin-featured products
 * first, then newest — always `limit` items.
 */
export async function getHomeProducts(limit = 6) {
  const [featured, newest] = await Promise.all([
    db
      .select()
      .from(products)
      .where(
        sql`${products.category} <> 'package' and ${products.active} = true and ${products.featured} = true`,
      )
      .orderBy(desc(products.createdAt))
      .limit(limit),
    db
      .select()
      .from(products)
      .where(sql`${products.category} <> 'package' and ${products.active} = true`)
      .orderBy(desc(products.createdAt))
      .limit(limit * 2),
  ]);

  const seen = new Set(featured.map((p) => p.id));
  const fill = newest.filter((p) => !seen.has(p.id));
  return [...featured, ...fill].slice(0, limit);
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

export async function getInvoiceWithItems(id: string) {
  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);
  if (rows.length === 0) return null;
  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, id))
    .orderBy(asc(invoiceItems.position));
  return { invoice: rows[0], items };
}

/**
 * Next sequential custom-invoice number (INV-0001, INV-0002, …).
 * Custom invoices all live in one table, so max-suffix + 1 keeps the
 * sequence gapless; single-admin use makes races a non-issue.
 */
export async function nextInvoiceNo(): Promise<string> {
  const rows = await db
    .select({ invoiceNo: invoices.invoiceNo })
    .from(invoices)
    .where(sql`${invoices.invoiceNo} ~ '^INV-[0-9]+$'`);
  const next = rows.reduce(
    (max, r) => Math.max(max, Number(r.invoiceNo.slice(4))),
    0,
  ) + 1;
  return `INV-${String(next).padStart(4, "0")}`;
}
