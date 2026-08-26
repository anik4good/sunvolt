import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, products } from "@/db/schema";
import {
  json,
  conflict,
  notFound,
  parseBody,
  revalidateSite,
  serializeProduct,
  withApiKey,
  apiError,
} from "@/lib/api";
import { isUuid, productUpdateSchema } from "@/lib/api-schemas";
import { buildProductValues, missingPackageFields, slugify } from "@/lib/api-products";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ idOrSlug: string }> };

async function findProduct(idOrSlug: string) {
  const where = isUuid(idOrSlug)
    ? or(eq(products.id, idOrSlug), eq(products.slug, idOrSlug))
    : eq(products.slug, idOrSlug);
  const rows = await db.select().from(products).where(where).limit(1);
  return rows[0] ?? null;
}

/** GET /api/v1/products/{idOrSlug} — fetch by UUID or slug. */
export const GET = withApiKey<Ctx>(async (_request, ctx) => {
  const { idOrSlug } = await ctx.params;
  const product = await findProduct(idOrSlug);
  if (!product) return notFound("Product");
  return json(serializeProduct(product));
});

/** PATCH /api/v1/products/{idOrSlug} — partial update (send only changed fields). */
export const PATCH = withApiKey<Ctx>(async (request, ctx) => {
  const { idOrSlug } = await ctx.params;
  const existing = await findProduct(idOrSlug);
  if (!existing) return notFound("Product");

  const parsed = await parseBody(request, productUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const values = await buildProductValues(parsed.data, existing);

  const missing = missingPackageFields(values);
  if (missing.length > 0) {
    return apiError(
      400,
      "validation_error",
      `Required for category "package": ${missing.join(", ")}.`,
    );
  }
  if (values.price === null || values.price === undefined) {
    values.price = existing.price;
  }
  if (!values.slug) values.slug = existing.slug ?? slugify(String(values.name ?? existing.name));

  try {
    const [updated] = await db
      .update(products)
      .set(values as Partial<typeof products.$inferInsert>)
      .where(eq(products.id, existing.id))
      .returning();
    revalidateSite();
    return json(serializeProduct(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("products_slug_unique") || message.includes("duplicate key")) {
      return conflict(`Slug "${values.slug}" is already used by another product.`);
    }
    throw error;
  }
});

/** DELETE /api/v1/products/{idOrSlug} — 409 when orders reference it. */
export const DELETE = withApiKey<Ctx>(async (_request, ctx) => {
  const { idOrSlug } = await ctx.params;
  const existing = await findProduct(idOrSlug);
  if (!existing) return notFound("Product");

  const referenced = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.productId, existing.id))
    .limit(1);
  if (referenced.length > 0) {
    return conflict(
      "This product has orders attached, so it can't be deleted. Set active=false instead.",
    );
  }

  await db.delete(products).where(eq(products.id, existing.id));
  revalidateSite();
  return json({ deleted: true });
});
