import { sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { PRODUCT_CATEGORIES, PACKAGE_CATEGORY } from "@/lib/categories";
import { json, withApiKey } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/v1/categories — slugs/labels/icons with live active-product counts. */
export const GET = withApiKey(async () => {
  const rows = await db
    .select({ category: products.category, value: sql<number>`count(*)::int` })
    .from(products)
    .where(sql`${products.active} = true`)
    .groupBy(products.category);
  const counts = new Map(rows.map((r) => [r.category, r.value]));

  const data = [
    ...PRODUCT_CATEGORIES.map((c) => ({
      slug: c.slug,
      label: c.label,
      labelBn: c.labelBn,
      icon: c.icon,
      count: counts.get(c.slug) ?? 0,
    })),
    {
      slug: PACKAGE_CATEGORY,
      label: "Backup Package",
      labelBn: "ব্যাকআপ প্যাকেজ",
      icon: "📦",
      count: counts.get(PACKAGE_CATEGORY) ?? 0,
    },
  ];

  return json({ data, meta: { total: data.length } });
});
