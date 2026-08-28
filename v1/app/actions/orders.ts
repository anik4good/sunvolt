"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderAppliances, orderItems, orders } from "@/db/schema";
import { getActiveProducts } from "@/lib/queries";

export interface CreateOrderState {
  message: string;
}

/** Normalize Bangladeshi mobile numbers: +880179…/880179…/0179… → 0179… */
function normalizePhone(input: string): string {
  let p = input.replace(/[\s-]/g, "");
  if (p.startsWith("+880")) p = "0" + p.slice(4);
  else if (p.startsWith("880")) p = "0" + p.slice(3);
  return p;
}

const bdPhone = /^(?:\+?88)?01[3-9]\d{8}$/;

const calcSchema = z.object({
  selections: z
    .array(
      z.object({
        id: z.uuid().nullable().optional(),
        name: z.string().trim().min(1).max(60),
        watt: z.coerce.number().int().min(1).max(2000),
        quantity: z.coerce.number().int().min(1).max(20),
      }),
    )
    .max(30),
  backupHours: z.coerce.number().int().min(1).max(48).optional(),
  recommendedSlug: z.string().max(120).optional(),
});

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "সম্পূর্ণ নাম লিখুন").max(80),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((p) => bdPhone.test(p), "সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)"),
  address: z.string().trim().min(5, "সম্পূর্ণ ঠিকানা লিখুন").max(250),
  district: z.string().trim().min(2, "জেলার নাম লিখুন").max(50),
  installationRequired: z.boolean(),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        slug: z.string().min(1).max(120),
        quantity: z.coerce.number().int().min(1).max(10),
      }),
    )
    .min(1, "কার্টে অন্তত একটি প্যাকেজ রাখুন")
    .max(10),
  calc: calcSchema.optional(),
});

export async function createOrder(
  _prev: CreateOrderState | undefined,
  formData: FormData,
): Promise<CreateOrderState> {
  let parsedCalc: z.infer<typeof calcSchema> | undefined;
  const calcRaw = formData.get("calc");
  if (typeof calcRaw === "string" && calcRaw.length > 0) {
    try {
      parsedCalc = calcSchema.parse(JSON.parse(calcRaw));
    } catch {
      // Malformed calculator context — proceed as a plain order.
      parsedCalc = undefined;
    }
  }

  let parsedItems: { slug: string; quantity: number }[] = [];
  const itemsRaw = formData.get("items");
  if (typeof itemsRaw === "string" && itemsRaw.length > 0) {
    try {
      parsedItems = z.array(z.object({ slug: z.string(), quantity: z.coerce.number() })).parse(JSON.parse(itemsRaw));
    } catch {
      parsedItems = [];
    }
  }

  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    district: formData.get("district"),
    installationRequired: formData.get("installationRequired") === "on",
    notes: formData.get("notes") || undefined,
    items: parsedItems,
    calc: parsedCalc,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { message: first?.message ?? "ফর্মের তথ্য যাচাই করুন।" };
  }

  const data = parsed.data;

  // Prices are always taken from the database, never from the client.
  const available = await getActiveProducts();
  const bySlug = new Map(available.map((p) => [p.slug, p]));
  const lineItems = data.items
    .map((item) => {
      const product = bySlug.get(item.slug);
      if (!product) return null;
      return { product, quantity: item.quantity };
    })
    .filter((x): x is { product: (typeof available)[number]; quantity: number } => x !== null);

  if (lineItems.length === 0) {
    return { message: "কার্টের প্যাকেজগুলো এই মুহূর্তে উপলব্ধ নেই।" };
  }

  const subtotal = lineItems.reduce(
    (sum, li) => sum + Number(li.product.price) * li.quantity,
    0,
  );
  const installationTotal = data.installationRequired
    ? lineItems.reduce(
        (sum, li) => sum + Number(li.product.installationPrice ?? 0) * li.quantity,
        0,
      )
    : 0;
  const totalPrice = subtotal + installationTotal;

  // Calculator figures are recomputed server-side (plan §28).
  const selections = data.calc?.selections ?? [];
  const totalLoad = selections.reduce((sum, s) => sum + s.watt * s.quantity, 0);
  const backupHours = data.calc?.backupHours ?? null;
  const requiredEnergy =
    totalLoad > 0 && backupHours !== null ? totalLoad * backupHours : null;

  const [created] = await db
    .insert(orders)
    .values({
      customerName: data.customerName,
      phone: data.phone,
      address: data.address,
      district: data.district,
      productId: lineItems[0].product.id,
      quantity: lineItems.reduce((sum, li) => sum + li.quantity, 0),
      totalPrice: totalPrice.toFixed(2),
      totalLoad: totalLoad > 0 ? totalLoad : null,
      backupHours,
      requiredEnergy,
      installationRequired: data.installationRequired,
      notes: data.notes?.length ? data.notes : null,
      status: "pending",
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    lineItems.map((li) => ({
      orderId: created.id,
      productId: li.product.id,
      productName: li.product.name,
      quantity: li.quantity,
      unitPrice: Number(li.product.price).toFixed(2),
      totalPrice: (Number(li.product.price) * li.quantity).toFixed(2),
    })),
  );

  if (selections.length > 0) {
    await db.insert(orderAppliances).values(
      selections.map((s) => ({
        orderId: created.id,
        applianceId: s.id ?? null,
        name: s.name,
        quantity: s.quantity,
        watt: s.watt,
        totalWatt: s.watt * s.quantity,
      })),
    );
  }

  redirect(`/order/${created.id}`);
}
