"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "installed",
  "completed",
  "cancelled",
] as const;

const statusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(STATUSES),
});

export async function updateOrderStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = statusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    redirect(`/admin/orders?error=invalid-status`);
  }

  await db
    .update(orders)
    .set({ status: parsed.data.status })
    .where(eq(orders.id, parsed.data.orderId));

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  redirect(`/admin/orders/${parsed.data.orderId}?updated=1`);
}
