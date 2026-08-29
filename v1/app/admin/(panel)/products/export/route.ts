import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getCategories } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV export of the filtered product list (same filters as the table). */
export async function GET(request: NextRequest) {
  await requireAdmin();

  const params = request.nextUrl.searchParams;
  const categories = await getCategories();
  const activeCategories = categories.filter((c) => c.active);

  const q = params.get("q")?.trim() || "";
  const category = activeCategories.some((c) => c.slug === params.get("category"))
    ? params.get("category")!
    : null;
  const [minPriceRaw, maxPriceRaw] = (params.get("price") ?? "").split(":");
  const minPrice = minPriceRaw && !Number.isNaN(Number(minPriceRaw)) ? minPriceRaw : null;
  const maxPrice = maxPriceRaw && !Number.isNaN(Number(maxPriceRaw)) ? maxPriceRaw : null;

  const conditions: SQL[] = [];
  if (q) {
    const like = `%${q.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${products.name}) like ${like} or lower(coalesce(${products.brand}, '')) like ${like} or lower(${products.slug}) like ${like})`,
    );
  }
  if (category) conditions.push(eq(products.category, category));
  if (minPrice) conditions.push(gte(products.price, minPrice));
  if (maxPrice) conditions.push(lte(products.price, maxPrice));

  const rows = await db
    .select()
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(products.name));

  const header = [
    "Name",
    "Slug",
    "Category",
    "Brand",
    "Model",
    "Price",
    "Stock",
    "Published",
    "Featured",
    "Created",
  ];
  const lines = [header.join(",")];
  for (const product of rows) {
    lines.push(
      [
        csvCell(product.name),
        product.slug,
        product.category,
        product.brand ?? "",
        product.model ?? "",
        product.price,
        product.stock,
        product.active ? "yes" : "no",
        product.featured ? "yes" : "no",
        product.createdAt.toISOString().slice(0, 10),
      ].join(","),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${stamp}.csv"`,
    },
  });
}
