import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getOrderWithDetails } from "@/lib/queries";
import {
  apiError,
  json,
  notFound,
  parseBody,
  revalidateSite,
  withApiKey,
} from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function normalizePhone(input: string): string {
  let p = input.replace(/[\s-]/g, "");
  if (p.startsWith("+880")) p = "0" + p.slice(4);
  else if (p.startsWith("880")) p = "0" + p.slice(3);
  return p;
}

const bdPhone = /^(?:\+?88)?01[3-9]\d{8}$/;

const updateOrderSchema = z
  .object({
    status: z.enum([
      "pending",
      "confirmed",
      "processing",
      "installed",
      "completed",
      "cancelled",
    ]),
    customerName: z.string().trim().min(2).max(80),
    phone: z
      .string()
      .trim()
      .transform(normalizePhone)
      .refine((p) => bdPhone.test(p), "Phone must be a valid BD number, e.g. 01712345678"),
    address: z.string().trim().min(5).max(250),
    district: z.string().trim().min(2).max(50),
    notes: z.string().trim().max(500).nullable(),
    installationRequired: z.boolean(),
  })
  .partial();

async function findOrder(id: string) {
  const rows = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0] ?? null;
}

/** GET /api/v1/orders/{id} — order with items + calculator appliances. */
export const GET = withApiKey<Ctx>(async (_request, ctx) => {
  const { id } = await ctx.params;
  const detail = await getOrderWithDetails(id);
  if (!detail) return notFound("Order");
  return json({
    ...detail.order,
    totalPrice: detail.order.totalPrice === null ? null : Number(detail.order.totalPrice),
    product: detail.product,
    items: detail.items.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
    appliances: detail.appliances,
  });
});

/** PATCH /api/v1/orders/{id} — status / customer info / notes. */
export const PATCH = withApiKey<Ctx>(async (request, ctx) => {
  const { id } = await ctx.params;
  const existing = await findOrder(id);
  if (!existing) return notFound("Order");

  const parsed = await parseBody(request, updateOrderSchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return apiError(400, "validation_error", "Send at least one field to update.");
  }

  const [updated] = await db
    .update(orders)
    .set({
      ...data,
      notes: data.notes !== undefined ? (data.notes?.length ? data.notes : null) : undefined,
    })
    .where(eq(orders.id, id))
    .returning();

  revalidateSite();
  revalidatePath("/admin/orders");
  return json({
    ...updated,
    totalPrice: updated.totalPrice === null ? null : Number(updated.totalPrice),
  });
});

/** DELETE /api/v1/orders/{id} — items and appliances cascade. */
export const DELETE = withApiKey<Ctx>(async (_request, ctx) => {
  const { id } = await ctx.params;
  const existing = await findOrder(id);
  if (!existing) return notFound("Order");

  await db.delete(orders).where(eq(orders.id, id));
  revalidateSite();
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return json({ deleted: true });
});
