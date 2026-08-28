"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { appliances, orderAppliances } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export interface AdminFormState {
  message: string;
}

const applianceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  category: z.string().trim().min(1).max(40),
  defaultWatt: z.coerce.number().int().min(1, "Wattage must be at least 1").max(2000),
  icon: z.string().trim().min(1).max(8),
  active: z.coerce.boolean(),
});

export async function saveAppliance(
  id: string | null,
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = applianceSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    defaultWatt: formData.get("defaultWatt"),
    icon: formData.get("icon"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const values = {
    name: parsed.data.name,
    category: parsed.data.category,
    defaultWatt: parsed.data.defaultWatt,
    icon: parsed.data.icon,
    active: parsed.data.active,
  };

  if (id) {
    await db.update(appliances).set(values).where(eq(appliances.id, id));
  } else {
    await db.insert(appliances).values(values);
  }

  revalidatePath("/", "layout");
  redirect("/admin/appliances?saved=1");
}

export async function toggleApplianceActive(
  id: string,
  active: boolean,
): Promise<void> {
  await requireAdmin();
  await db.update(appliances).set({ active }).where(eq(appliances.id, id));
  revalidatePath("/", "layout");
  redirect("/admin/appliances");
}

export async function deleteAppliance(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { message: "Missing appliance id." };

  const referenced = await db
    .select({ id: orderAppliances.id })
    .from(orderAppliances)
    .where(eq(orderAppliances.applianceId, id))
    .limit(1);
  if (referenced.length > 0) {
    return {
      message: "This appliance appears in saved orders and can't be deleted. Disable it instead.",
    };
  }

  await db.delete(appliances).where(eq(appliances.id, id));
  revalidatePath("/", "layout");
  redirect("/admin/appliances?deleted=1");
}
