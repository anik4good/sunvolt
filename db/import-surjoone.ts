import "dotenv/config";
import { readdirSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { products } from "./schema";

/**
 * Full catalog import from the SurjoOne store
 * (https://surjoone.saynth.com — same business). Packages (custom combos)
 * are NOT touched — this only syncs individual products/components.
 * Idempotent: rows are matched by slug and updated.
 */

interface SurjoProduct {
  name: string;
  nameBn: string | null;
  slug: string;
  shortDesc: string | null;
  shortDescBn: string | null;
  brand: string | null;
  model: string | null;
  price: number;
  discountPct: number;
  stock: number;
  specs: Record<string, string> | null;
  features: string[] | null;
  warranty: string | null;
  isPublished: boolean;
  category: { slug: string; name: string } | null;
}

function stripSlugSuffix(slug: string): string {
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  if (parts.length > 2 && last.length === 5 && /^[a-z0-9]+$/.test(last)) {
    parts.pop();
    return parts.join("-");
  }
  return slug;
}

/** SurjoOne API category slug → clean SunVolt category slug. */
const CATEGORY_MAP: Record<string, string> = {
  "solar-inverter-e5fr4": "solar-inverter",
  "bms-swbzj": "bms",
  "solar-panel-ftilh": "solar-panel",
  "ips-a1ly1": "inverter",
  "diy-solar-ezozx": "diy-solar",
  "mppt-charger-6j9rd": "mppt-charger",
  "dc-charger-ibb7m": "dc-charger",
  "accessories-czrbv": "accessories",
  "battery-iarq6": "battery",
};

function categorySlug(p: SurjoProduct): string {
  const raw = p.category?.slug ?? "accessories-czrbv";
  return CATEGORY_MAP[raw] ?? stripSlugSuffix(raw);
}

function warrantyMonths(warranty: string | null): number {
  if (!warranty) return 0;
  const months = /(\d+)\s*month/i.exec(warranty);
  if (months) return Number(months[1]);
  const years = /(\d+)\s*year/i.exec(warranty);
  if (years) return Number(years[1]) * 12;
  return 0;
}

async function main() {
  const response = await fetch(
    "https://surjoone.saynth.com/api/products?limit=100",
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  const payload = (await response.json()) as { data: SurjoProduct[] };

  const imageFiles = readdirSync(join(process.cwd(), "public", "products"));
  const imageBySlug = new Map<string, string>();
  for (const file of imageFiles) {
    imageBySlug.set(file.replace(/\.(png|jpe?g|webp)$/i, ""), file);
  }

  let created = 0;
  let updated = 0;
  const byCategory = new Map<string, number>();

  for (const item of payload.data) {
    const slug = stripSlugSuffix(item.slug);
    const category = categorySlug(item);
    byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
    const imageFile = imageBySlug.get(slug);

    const values = {
      name: item.name,
      nameBn: item.nameBn ?? null,
      category,
      slug,
      description: item.shortDesc ?? item.shortDescBn ?? null,
      brand: item.brand ?? null,
      model: item.model ?? null,
      specs: item.specs ?? null,
      features: item.features ?? null,
      batteryVoltage: null,
      batteryCapacityAh: null,
      batteryType: null,
      solarPanelWatt: null,
      controllerWatt: null,
      backupHours: null,
      recommendedLoadWatt: null,
      price: item.price.toFixed(2),
      discountPct: Math.max(0, Math.min(90, Math.round(item.discountPct ?? 0))),
      warrantyMonths: warrantyMonths(item.warranty),
      stock: item.stock,
      imageUrl: imageFile ? `/products/${imageFile}` : null,
      active: item.isPublished,
      featured: false,
    };

    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      await db.update(products).set(values).where(eq(products.id, existing[0].id));
      updated += 1;
    } else {
      await db.insert(products).values(values);
      created += 1;
    }
  }

  console.log("Imported by category:", Object.fromEntries(byCategory));
  console.log(`Done. created=${created} updated=${updated}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
