import { type NextRequest } from "next/server";
import { desc, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";
import { nextInvoiceNo } from "@/lib/queries";
import {
  json,
  listResponse,
  parseBody,
  parsePagination,
  revalidateSite,
  withApiKey,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const invoiceSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).nullable().optional(),
  address: z.string().trim().max(250).nullable().optional(),
  district: z.string().trim().max(50).nullable().optional(),
  paymentTerms: z.string().trim().max(60).nullable().optional(),
  salesPerson: z.string().trim().max(60).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(200),
        quantity: z.number().int().min(1).max(9999),
        unitPrice: z.number().min(0).max(10_000_000),
      }),
    )
    .min(1, "Add at least one item")
    .max(30),
});

function serializeInvoice<T extends { totalAmount: unknown }>(invoice: T) {
  return { ...invoice, totalAmount: Number(invoice.totalAmount) };
}

/** GET /api/v1/invoices — list newest-first with their line items. */
export const GET = withApiKey(async (request: NextRequest) => {
  const { limit, offset } = parsePagination(request.nextUrl);

  const [rows, counted] = await Promise.all([
    db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(limit).offset(offset),
    db.select({ value: sql<number>`count(*)::int` }).from(invoices),
  ]);

  const items =
    rows.length > 0
      ? await db
          .select()
          .from(invoiceItems)
          .where(inArray(invoiceItems.invoiceId, rows.map((r) => r.id)))
          .orderBy(invoiceItems.position)
      : [];

  const data = rows.map((invoice) => ({
    ...serializeInvoice(invoice),
    items: items
      .filter((i) => i.invoiceId === invoice.id)
      .map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
  }));

  return listResponse(data, counted[0]?.value ?? 0, limit, offset);
});

/** POST /api/v1/invoices — totals computed server-side, invoiceNo sequential. */
export const POST = withApiKey(async (request: NextRequest) => {
  const parsed = await parseBody(request, invoiceSchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  const lineTotals = data.items.map((i) => ({ ...i, total: i.quantity * i.unitPrice }));
  const grandTotal = lineTotals.reduce((sum, i) => sum + i.total, 0);
  const invoiceNo = await nextInvoiceNo();

  const created = await db.transaction(async (tx) => {
    const [invoice] = await tx
      .insert(invoices)
      .values({
        invoiceNo,
        customerName: data.customerName,
        phone: data.phone || null,
        address: data.address || null,
        district: data.district || null,
        paymentTerms: data.paymentTerms || null,
        salesPerson: data.salesPerson || null,
        notes: data.notes || null,
        totalAmount: grandTotal.toFixed(2),
      })
      .returning();
    await tx.insert(invoiceItems).values(
      lineTotals.map((item, position) => ({
        invoiceId: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: item.total.toFixed(2),
        position,
      })),
    );
    return invoice;
  });

  const items = await db
    .select()
    .from(invoiceItems)
    .where(inArray(invoiceItems.invoiceId, [created.id]))
    .orderBy(invoiceItems.position);

  revalidateSite();
  return json(
    {
      ...serializeInvoice(created),
      items: items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
    },
    201,
  );
});
