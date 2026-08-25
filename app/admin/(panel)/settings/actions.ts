"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export interface AdminFormState {
  message: string;
}

const settingsSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(80),
  phone: z.string().trim().min(6, "Phone is required").max(20),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, "WhatsApp must be digits in international format, e.g. 8801601744070"),
  address: z.string().trim().max(250),
  currency: z.string().trim().min(1).max(8),
  batteryEfficiency: z.coerce.number().min(0.1).max(1),
  systemEfficiency: z.coerce.number().min(0.1).max(1),
  recommendedReserve: z.coerce.number().min(0).max(1),
  systemVoltage: z.coerce.number().min(1).max(1000),
  panelOutputFactor: z.coerce.number().min(0.1).max(1),
  peakSunHours: z.coerce.number().min(1).max(12),
  batterySizes: z
    .string()
    .trim()
    .regex(/^\d+(\s*,\s*\d+)*$/, "Battery sizes must be numbers separated by commas"),
  controllerSizes: z
    .string()
    .trim()
    .regex(/^\d+(\s*,\s*\d+)*$/, "Controller ratings must be numbers separated by commas"),
});

function normalizeSizes(csv: string): string {
  return csv
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b)
    .join(",");
}

export async function updateSettings(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    businessName: formData.get("businessName"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    address: formData.get("address") ?? "",
    currency: formData.get("currency"),
    batteryEfficiency: formData.get("batteryEfficiency"),
    systemEfficiency: formData.get("systemEfficiency"),
    recommendedReserve: formData.get("recommendedReserve"),
    systemVoltage: formData.get("systemVoltage"),
    panelOutputFactor: formData.get("panelOutputFactor"),
    peakSunHours: formData.get("peakSunHours"),
    batterySizes: formData.get("batterySizes"),
    controllerSizes: formData.get("controllerSizes"),
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const data = parsed.data;

  await db
    .update(settings)
    .set({
      businessName: data.businessName,
      phone: data.phone,
      whatsapp: data.whatsapp,
      address: data.address,
      currency: data.currency,
      batteryEfficiency: data.batteryEfficiency.toFixed(3),
      systemEfficiency: data.systemEfficiency.toFixed(3),
      recommendedReserve: data.recommendedReserve.toFixed(3),
      systemVoltage: data.systemVoltage.toFixed(1),
      panelOutputFactor: data.panelOutputFactor.toFixed(3),
      peakSunHours: data.peakSunHours.toFixed(2),
      batterySizes: normalizeSizes(data.batterySizes),
      controllerSizes: normalizeSizes(data.controllerSizes),
    })
    .where(eq(settings.id, 1));

  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
