import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { getInvoiceWithItems } from "@/lib/queries";
import { json, notFound, revalidateSite, withApiKey } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function findInvoice(id: string) {
  const rows = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.id, id)).limit(1);
  return rows[0] ?? null;
}

/** GET /api/v1/invoices/{id} — invoice with ordered line items. */
export const GET = withApiKey<Ctx>(async (_request, ctx) => {
  const { id } = await ctx.params;
  const detail = await getInvoiceWithItems(id);
  if (!detail) return notFound("Invoice");
  return json({
    ...detail.invoice,
    totalAmount: Number(detail.invoice.totalAmount),
    items: detail.items.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  });
});

/** DELETE /api/v1/invoices/{id} — items cascade. */
export const DELETE = withApiKey<Ctx>(async (_request, ctx) => {
  const { id } = await ctx.params;
  const existing = await findInvoice(id);
  if (!existing) return notFound("Invoice");

  await db.delete(invoices).where(eq(invoices.id, id));
  revalidateSite();
  revalidatePath("/admin/invoices");
  return json({ deleted: true });
});
