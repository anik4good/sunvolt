"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const CATEGORY_SLUGS = [
  "package",
  "solar-inverter",
  "bms",
  "solar-panel",
  "inverter",
  "diy-solar",
  "mppt-charger",
  "dc-charger",
  "accessories",
  "battery",
] as const;

const productSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(120),
    nameBn: z.string().trim().max(160).optional(),
    category: z.enum(CATEGORY_SLUGS).default("package"),
    slug: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((v) => (v ? v : undefined)),
    description: z.string().trim().max(1000).optional(),
    brand: z.string().trim().max(80).optional(),
    model: z.string().trim().max(80).optional(),
    specsText: z.string().trim().max(4000).optional(),
    featuresText: z.string().trim().max(2000).optional(),
    batteryVoltage: z.coerce.number().int().min(0).max(1000).optional(),
    batteryCapacityAh: z.coerce.number().int().min(0).max(10000).optional(),
    batteryType: z.string().trim().max(60).optional(),
    solarPanelWatt: z.coerce.number().int().min(0).max(100000).optional(),
    controllerWatt: z.coerce.number().int().min(0).max(100000).optional(),
    backupHours: z.coerce.number().int().min(0).max(200).optional(),
    recommendedLoadWatt: z.coerce.number().int().min(0).max(100000).optional(),
    price: z.coerce.number().min(0).max(10_000_000),
    discountPct: z.coerce.number().int().min(0).max(90).default(0),
    installationPrice: z.coerce.number().min(0).max(10_000_000).optional(),
    warrantyMonths: z.coerce.number().int().min(0).max(120),
    stock: z.coerce.number().int().min(0).max(100000),
    imageUrl: z.string().trim().max(500).optional(),
    active: z.coerce.boolean(),
    featured: z.coerce.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.category !== "package") return;
    const required: [keyof typeof data, string][] = [
      ["batteryVoltage", "Battery voltage is required for packages"],
      ["batteryCapacityAh", "Battery capacity is required for packages"],
      ["backupHours", "Backup hours are required for packages"],
      ["recommendedLoadWatt", "Recommended load is required for packages"],
    ];
    for (const [field, message] of required) {
      if (!data[field]) {
        ctx.addIssue({ code: "custom", path: [field], message });
      }
    }
  });

/** Parse "Key: Value" lines into a spec object; blank lines ignored. */
function parseSpecs(text: string | undefined): Record<string, string> | null {
  if (!text) return null;
  const entries = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return [line, ""] as const;
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()] as const;
    })
    .filter(([key]) => key.length > 0);
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function parseFeatures(text: string | undefined): string[] | null {
  if (!text) return null;
  const items = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, "-")
      .replace(/^-+|-+$/g, "") || `package-${Date.now()}`
  );
}

function parseForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    nameBn: formData.get("nameBn") || undefined,
    category: formData.get("category") || "package",
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    brand: formData.get("brand") || undefined,
    model: formData.get("model") || undefined,
    specsText: formData.get("specsText") || undefined,
    featuresText: formData.get("featuresText") || undefined,
    batteryVoltage: formData.get("batteryVoltage") || undefined,
    batteryCapacityAh: formData.get("batteryCapacityAh") || undefined,
    batteryType: formData.get("batteryType") || undefined,
    solarPanelWatt: formData.get("solarPanelWatt") || 0,
    controllerWatt: formData.get("controllerWatt") || 0,
    backupHours: formData.get("backupHours") || undefined,
    recommendedLoadWatt: formData.get("recommendedLoadWatt") || undefined,
    price: formData.get("price"),
    discountPct: formData.get("discountPct") || 0,
    installationPrice: formData.get("installationPrice") || undefined,
    warrantyMonths: formData.get("warrantyMonths"),
    stock: formData.get("stock"),
    imageUrl: formData.get("imageUrl") || undefined,
    active: formData.get("active") === "on",
    featured: formData.get("featured") === "on",
  });
}

export interface ProductFormState {
  message: string;
}

export async function saveProduct(
  id: string | null,
  _prev: ProductFormState | undefined,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const data = parsed.data;
  const slug = data.slug ?? slugify(data.name);

  const values = {
    name: data.name,
    nameBn: data.nameBn || null,
    category: data.category,
    slug,
    description: data.description || null,
    brand: data.brand || null,
    model: data.model || null,
    specs: parseSpecs(data.specsText),
    features: parseFeatures(data.featuresText),
    batteryVoltage: data.category === "package" ? (data.batteryVoltage ?? null) : null,
    batteryCapacityAh: data.category === "package" ? (data.batteryCapacityAh ?? null) : null,
    batteryType: data.category === "package" ? (data.batteryType || "LiFePO4") : null,
    solarPanelWatt: data.solarPanelWatt || null,
    controllerWatt: data.controllerWatt || null,
    backupHours: data.category === "package" ? (data.backupHours ?? null) : null,
    recommendedLoadWatt:
      data.category === "package" ? (data.recommendedLoadWatt ?? null) : null,
    price: data.price.toFixed(2),
    discountPct: data.discountPct,
    installationPrice: data.installationPrice ? data.installationPrice.toFixed(2) : null,
    warrantyMonths: data.warrantyMonths,
    stock: data.stock,
    imageUrl: data.imageUrl || null,
    active: data.active,
    featured: data.featured,
  };

  try {
    if (id) {
      await db.update(products).set(values).where(eq(products.id, id));
    } else {
      await db.insert(products).values(values);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("products_slug_unique") || message.includes("duplicate key")) {
      return { message: `Slug "${slug}" is already used by another package.` };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  redirect("/admin/products?saved=1");
}

export async function toggleProductActive(id: string, active: boolean): Promise<void> {
  await requireAdmin();
  await db.update(products).set({ active }).where(eq(products.id, id));
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function toggleProductFeatured(id: string, featured: boolean): Promise<void> {
  await requireAdmin();
  await db.update(products).set({ featured }).where(eq(products.id, id));
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(
  _prev: ProductFormState | undefined,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { message: "Missing product id." };

  const referenced = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.productId, id))
    .limit(1);
  if (referenced.length > 0) {
    return {
      message:
        "This package has orders attached, so it can't be deleted. Disable it instead.",
    };
  }

  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/", "layout");
  redirect("/admin/products?deleted=1");
}
