import { type NextRequest } from "next/server";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import {
  json,
  listResponse,
  apiError,
  conflict,
  parseBody,
  parsePagination,
  revalidateSite,
  serializeProduct,
  withApiKey,
} from "@/lib/api";
import { productCreateSchema } from "@/lib/api-schemas";
import { buildProductValues, missingPackageFields, slugify } from "@/lib/api-products";
import { isValidCategorySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** GET /api/v1/products — list with filters (admin-management view). */
export const GET = withApiKey(async (request: NextRequest) => {
  const { limit, offset } = parsePagination(request.nextUrl);
  const params = request.nextUrl.searchParams;

  const conditions: SQL[] = [];
  const category = params.get("category");
  if (category) conditions.push(eq(products.category, category));
  const q = params.get("q")?.trim().toLowerCase();
  if (q) {
    const like = `%${q}%`;
    conditions.push(
      sql`(lower(${products.name}) like ${like} or lower(coalesce(${products.brand}, '')) like ${like})`,
    );
  }
  const active = params.get("active");
  if (active === "true" || active === "false") {
    conditions.push(eq(products.active, active === "true"));
  }
  const featured = params.get("featured");
  if (featured === "true" || featured === "false") {
    conditions.push(eq(products.featured, featured === "true"));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sort = params.get("sort") ?? "newest";
  const order =
    sort === "price-asc" ? asc(products.price) : sort === "price-desc" ? desc(products.price) : desc(products.createdAt);

  const [rows, counted] = await Promise.all([
    db.select().from(products).where(where).orderBy(order).limit(limit).offset(offset),
    db.select({ value: sql<number>`count(*)::int` }).from(products).where(where),
  ]);

  return listResponse(rows.map(serializeProduct), counted[0]?.value ?? 0, limit, offset);
});

/** POST /api/v1/products — create a product or package. */
export const POST = withApiKey(async (request: NextRequest) => {
  const parsed = await parseBody(request, productCreateSchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  if (!(await isValidCategorySlug(data.category))) {
    return apiError(
      400,
      "validation_error",
      `Unknown category "${data.category}". See GET /api/v1/categories.`,
    );
  }

  const values = await buildProductValues(data, null);

  const missing = missingPackageFields(values);
  if (missing.length > 0) {
    return apiError(
      400,
      "validation_error",
      `Required for category "package": ${missing.join(", ")}.`,
    );
  }
  if (values.price === null || values.price === undefined) {
    return apiError(
      400,
      "validation_error",
      "price is required (unless the solar-panel rate can price it).",
      [{ path: "price", message: "Provide a price or set panelVoltage + solarPanelWatt with a matching rate." }],
    );
  }
  if (!values.slug) values.slug = slugify(data.name);

  try {
    const [created] = await db
      .insert(products)
      .values(values as typeof products.$inferInsert)
      .returning();
    revalidateSite();
    return json(serializeProduct(created), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("products_slug_unique") || message.includes("duplicate key")) {
      return conflict(`Slug "${values.slug}" is already used by another product.`);
    }
    throw error;
  }
});
