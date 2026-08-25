"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { nextInvoiceNo } from "@/lib/queries";

export interface InvoiceFormState {
  message: string;
}

const itemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required").max(200),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(9999),
  unitPrice: z.coerce
    .number()
    .min(0, "Unit price can't be negative")
    .max(10_000_000),
});

const invoiceSchema = z.object({
  customerName: z.string().trim().min(2, "Customer name is required").max(80),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(250).optional(),
  district: z.string().trim().max(50).optional(),
  paymentTerms: z.string().trim().max(60).optional(),
  salesPerson: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(500).optional(),
  items: z.array(itemSchema).min(1, "Add at least one item").max(30),
});

export async function createInvoice(
  _prev: InvoiceFormState | undefined,
  formData: FormData,
): Promise<InvoiceFormState> {
  await requireAdmin();

  let parsedItems: unknown = [];
  const itemsRaw = formData.get("items");
  if (typeof itemsRaw === "string" && itemsRaw.length > 0) {
    try {
      parsedItems = JSON.parse(itemsRaw);
    } catch {
      parsedItems = [];
    }
  }

  const parsed = invoiceSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    district: formData.get("district") || undefined,
    paymentTerms: formData.get("paymentTerms") || undefined,
    salesPerson: formData.get("salesPerson") || undefined,
    notes: formData.get("notes") || undefined,
    items: parsedItems,
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const data = parsed.data;

  // Totals are always computed server-side, never trusted from the client.
  const lineTotals = data.items.map((i) => ({
    ...i,
    total: i.quantity * i.unitPrice,
  }));
  const grandTotal = lineTotals.reduce((sum, i) => sum + i.total, 0);
  const invoiceNo = await nextInvoiceNo();

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
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
      .returning({ id: invoices.id });
    await tx.insert(invoiceItems).values(
      lineTotals.map((item, position) => ({
        invoiceId: row.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: item.total.toFixed(2),
        position,
      })),
    );
    return row;
  });

  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices/${created.id}`);
}

export async function deleteInvoice(
  _prev: InvoiceFormState | undefined,
  formData: FormData,
): Promise<InvoiceFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) {
    return { message: "Invalid invoice id." };
  }

  // invoice_items rows cascade on delete
  await db.delete(invoices).where(eq(invoices.id, id));
  revalidatePath("/admin/invoices");
  redirect("/admin/invoices?deleted=1");
}
