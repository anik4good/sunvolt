import { type NextRequest } from "next/server";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { getActiveProducts } from "@/lib/queries";
import {
  apiError,
  json,
  listResponse,
  parseBody,
  parsePagination,
  revalidateSite,
  withApiKey,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "installed",
  "completed",
  "cancelled",
] as const;

/** Normalize Bangladeshi mobile numbers: +880179…/880179…/0179… → 0179… */
function normalizePhone(input: string): string {
  let p = input.replace(/[\s-]/g, "");
  if (p.startsWith("+880")) p = "0" + p.slice(4);
  else if (p.startsWith("880")) p = "0" + p.slice(3);
  return p;
}

const bdPhone = /^(?:\+?88)?01[3-9]\d{8}$/;

const createOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((p) => bdPhone.test(p), "Phone must be a valid BD number, e.g. 01712345678"),
  address: z.string().trim().min(5).max(250),
  district: z.string().trim().min(2).max(50),
  installationRequired: z.boolean().default(false),
  notes: z.string().trim().max(500).nullable().optional(),
  status: z.enum(ORDER_STATUSES).default("pending"),
  items: z
    .array(
      z.object({
        productId: z.string().uuid().optional(),
        slug: z.string().trim().min(1).max(120).optional(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, "Add at least one item")
    .max(10),
});

function serializeOrder<T extends { totalPrice: unknown }>(order: T) {
  return { ...order, totalPrice: order.totalPrice === null ? null : Number(order.totalPrice) };
}

/** GET /api/v1/orders — list with status / search filters, newest first. */
export const GET = withApiKey(async (request: NextRequest) => {
  const { limit, offset } = parsePagination(request.nextUrl);
  const params = request.nextUrl.searchParams;

  const conditions: SQL[] = [];
  const status = params.get("status");
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
    conditions.push(eq(orders.status, status as (typeof ORDER_STATUSES)[number]));
  }
  const q = params.get("q")?.trim().toLowerCase();
  if (q) {
    const like = `%${q}%`;
    const digits = q.replace(/\D/g, "");
    conditions.push(
      digits
        ? sql`(lower(${orders.customerName}) like ${like} or ${orders.phone} like ${`%${digits}%`})`
        : sql`lower(${orders.customerName}) like ${like}`,
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, counted] = await Promise.all([
    db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
    db.select({ value: sql<number>`count(*)::int` }).from(orders).where(where),
  ]);

  return listResponse(rows.map(serializeOrder), counted[0]?.value ?? 0, limit, offset);
});

/**
 * POST /api/v1/orders — create a manual order (phone / walk-in sale).
 * Prices are always taken from the database, never from the request.
 */
export const POST = withApiKey(async (request: NextRequest) => {
  const parsed = await parseBody(request, createOrderSchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  const available = await getActiveProducts();
  const byRef = new Map<string, (typeof available)[number]>();
  for (const p of available) {
    byRef.set(p.id, p);
    byRef.set(p.slug, p);
  }

  const lineItems: { product: (typeof available)[number]; quantity: number }[] = [];
  for (const item of data.items) {
    const product = (item.productId && byRef.get(item.productId)) || byRef.get(item.slug ?? "");
    if (!product) {
      return apiError(
        400,
        "validation_error",
        `No active product matches "${item.productId ?? item.slug}".`,
        [{ path: "items", message: `Unknown product: ${item.productId ?? item.slug}` }],
      );
    }
    lineItems.push({ product, quantity: item.quantity });
  }

  const subtotal = lineItems.reduce((sum, li) => sum + Number(li.product.price) * li.quantity, 0);
  const installationTotal = data.installationRequired
    ? lineItems.reduce(
        (sum, li) => sum + Number(li.product.installationPrice ?? 0) * li.quantity,
        0,
      )
    : 0;
  const totalPrice = subtotal + installationTotal;

  const created = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        customerName: data.customerName,
        phone: data.phone,
        address: data.address,
        district: data.district,
        productId: lineItems[0].product.id,
        quantity: lineItems.reduce((sum, li) => sum + li.quantity, 0),
        totalPrice: totalPrice.toFixed(2),
        installationRequired: data.installationRequired,
        notes: data.notes?.length ? data.notes : null,
        status: data.status,
      })
      .returning();
    await tx.insert(orderItems).values(
      lineItems.map((li) => ({
        orderId: order.id,
        productId: li.product.id,
        productName: li.product.name,
        quantity: li.quantity,
        unitPrice: Number(li.product.price).toFixed(2),
        totalPrice: (Number(li.product.price) * li.quantity).toFixed(2),
      })),
    );
    return order;
  });

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, created.id));
  revalidateSite();
  return json(
    {
      ...serializeOrder(created),
      items: items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
    },
    201,
  );
});
