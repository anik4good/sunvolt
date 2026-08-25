"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";
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
    exampleFanCount: z.coerce.number().int().min(0).max(20).optional(),
    exampleLightCount: z.coerce.number().int().min(0).max(30).optional(),
    price: z.coerce.number().min(0).max(10_000_000),
    discountPct: z.coerce.number().int().min(0).max(90).default(0),
    installationPrice: z.coerce.number().min(0).max(10_000_000).optional(),
    warrantyMonths: z.coerce.number().int().min(0).max(120),
    stock: z.coerce.number().int().min(0).max(100000),
    // Ordered image list; first entry is the cover image
    images: z
      .array(z.string().trim().min(1).max(500))
      .max(10)
      .default([]),
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

/** Parse the ordered image list submitted as JSON by the images editor. */
function parseImages(formData: FormData): unknown {
  const raw = formData.get("imagesJson");
  if (typeof raw !== "string" || raw.length === 0) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
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
    exampleFanCount: formData.get("exampleFanCount") || undefined,
    exampleLightCount: formData.get("exampleLightCount") || undefined,
    price: formData.get("price"),
    discountPct: formData.get("discountPct") || 0,
    installationPrice: formData.get("installationPrice") || undefined,
    warrantyMonths: formData.get("warrantyMonths"),
    stock: formData.get("stock"),
    images: parseImages(formData),
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
    batteryVoltage:
      data.category === "package" && data.batteryVoltage != null
        ? String(data.batteryVoltage)
        : null,
    batteryCapacityAh: data.category === "package" ? (data.batteryCapacityAh ?? null) : null,
    batteryType: data.category === "package" ? (data.batteryType || "LiFePO4") : null,
    solarPanelWatt: data.solarPanelWatt || null,
    controllerWatt: data.controllerWatt || null,
    backupHours: data.category === "package" ? (data.backupHours ?? null) : null,
    recommendedLoadWatt:
      data.category === "package" ? (data.recommendedLoadWatt ?? null) : null,
    exampleFanCount:
      data.category === "package" ? (data.exampleFanCount ?? null) : null,
    exampleLightCount:
      data.category === "package" ? (data.exampleLightCount ?? null) : null,
    price: data.price.toFixed(2),
    discountPct: data.discountPct,
    installationPrice: data.installationPrice ? data.installationPrice.toFixed(2) : null,
    warrantyMonths: data.warrantyMonths,
    stock: data.stock,
    imageUrl: data.images[0] ?? null,
    images: data.images.slice(1),
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

export interface UploadResult {
  path?: string;
  error?: string;
}

const UPLOAD_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Save an uploaded product image into public/products and return its
 * site path. The stored filename is fully generated, so the original
 * name can't escape the directory or collide with existing files.
 */
export async function uploadProductImage(file: File): Promise<UploadResult> {
  await requireAdmin();

  const ext = UPLOAD_TYPES[file.type];
  if (!ext) {
    return { error: "Only PNG, JPG, WebP or GIF images are allowed." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Image must be under 5 MB." };
  }
  if (file.size === 0) {
    return { error: "The selected file is empty." };
  }

  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "products");
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  } catch {
    return { error: "Could not save the file on the server." };
  }

  revalidatePath("/admin/products");
  return { path: `/products/${name}` };
}
