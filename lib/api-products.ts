import { getSettings } from "@/lib/queries";
import { parsePanelRates } from "@/lib/panel-rates";
import type { productCreateSchema, productUpdateSchema } from "@/lib/api-schemas";
import type { Product } from "@/db/schema";
import type { z } from "zod";
import { sanitizeProductDescription } from "@/lib/product-description";

/**
 * Shared mapping between API JSON bodies and the products table,
 * used by POST /api/v1/products and PATCH /api/v1/products/{idOrSlug}.
 * Mirrors the admin form rules (Admin → products/actions.ts): package
 * fields are nulled for components, panels keep their voltage, the
 * first image is the cover.
 */

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, "-")
      .replace(/^-+|-+$/g, "") || `package-${Date.now()}`
  );
}

/** Auto-price a solar panel from the global per-watt rate for its voltage. */
export async function panelPriceFromRate(
  volt: number | null | undefined,
  watt: number | null | undefined,
): Promise<number | null> {
  if (!volt || !watt) return null;
  const settings = await getSettings();
  const rate = parsePanelRates(settings.panelRates).find((r) => r.volt === volt)
    ?.perWatt;
  if (!rate) return null;
  return Math.round(rate * watt * 100) / 100;
}

const PACKAGE_FIELDS = [
  "batteryCapacityAh",
  "batteryType",
  "backupHours",
  "recommendedLoadWatt",
  "exampleFanCount",
  "exampleLightCount",
] as const;

function specValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Build the DB column values for a create or patch. `data` fields that are
 * `undefined` fall back to `existing` (patch semantics); `null` clears.
 */
export async function buildProductValues(
  data: ProductCreateInput | ProductUpdateInput,
  existing: Product | null,
): Promise<Record<string, unknown>> {
  const category = data.category ?? existing?.category ?? "package";
  const isPackage = category === "package";

  const values: Record<string, unknown> = {
    name: data.name ?? existing?.name,
    nameBn: specValue(data.nameBn !== undefined ? data.nameBn : (existing?.nameBn ?? null)),
    category,
    slug: data.slug || existing?.slug,
    description: sanitizeProductDescription(
      data.description !== undefined ? data.description : (existing?.description ?? null),
    ),
    brand: specValue(data.brand !== undefined ? data.brand : (existing?.brand ?? null)),
    model: specValue(data.model !== undefined ? data.model : (existing?.model ?? null)),
    specs: data.specs !== undefined ? data.specs : (existing?.specs ?? null),
    features: data.features !== undefined ? data.features : (existing?.features ?? null),
    highlights: data.highlights !== undefined ? data.highlights : (existing?.highlights ?? null),
    packaging: data.packaging !== undefined ? data.packaging : (existing?.packaging ?? null),
    sourceUrl: specValue(
      data.sourceUrl !== undefined ? data.sourceUrl : (existing?.sourceUrl ?? null),
    ),
    // Package spec fields only exist for packages; components null them.
    ...(Object.fromEntries(
      PACKAGE_FIELDS.map((field) => [
        field,
        field === "batteryType"
          ? // Packages default their chemistry like the admin form does.
            isPackage
            ? (specValue(
                data.batteryType !== undefined
                  ? data.batteryType
                  : (existing?.batteryType ?? null),
              ) ?? "LiFePO4")
            : null
          : isPackage
            ? ((data[field] ?? existing?.[field]) ?? null)
            : null,
      ]),
    ) as Record<string, unknown>),
    batteryVoltage: isPackage
      ? data.batteryVoltage != null
        ? String(data.batteryVoltage)
        : existing?.batteryVoltage ?? null
      : null,
    // Panels remember their nominal voltage for rate pricing.
    panelVoltage: category === "solar-panel" ? (data.panelVoltage ?? existing?.panelVoltage ?? null) : null,
    solarPanelWatt: data.solarPanelWatt ?? existing?.solarPanelWatt ?? null,
    controllerWatt: data.controllerWatt ?? existing?.controllerWatt ?? null,
    discountPct: data.discountPct ?? existing?.discountPct ?? 0,
    installationPrice:
      data.installationPrice != null
        ? data.installationPrice.toFixed(2)
        : data.installationPrice === null
          ? null
          : existing?.installationPrice ?? null,
    warrantyMonths: data.warrantyMonths ?? existing?.warrantyMonths ?? 6,
    stock: data.stock ?? existing?.stock ?? 0,
    active: data.active ?? existing?.active ?? true,
    featured: data.featured ?? existing?.featured ?? false,
  };

  // Images: first entry is the cover, the rest are the gallery.
  if (data.images !== undefined) {
    const images = data.images ?? [];
    values.imageUrl = images[0] ?? null;
    values.images = images.slice(1);
  } else {
    values.imageUrl = existing?.imageUrl ?? null;
    values.images = existing?.images ?? null;
  }

  // Cost: explicit null clears it; undefined keeps the stored ladder.
  if (data.costPrice !== undefined) {
    values.costPrice = data.costPrice;
  } else {
    values.costPrice = existing?.costPrice ?? null;
  }

  // Price: global panel rate wins, then the sent price, then existing.
  const panelPrice =
    category === "solar-panel"
      ? await panelPriceFromRate(
          values.panelVoltage as number | null,
          values.solarPanelWatt as number | null,
        )
      : null;
  const fallbackPrice = data.price ?? (existing ? Number(existing.price) : null);
  const finalPrice = panelPrice ?? fallbackPrice;
  values.price = finalPrice != null ? finalPrice.toFixed(2) : null;

  return values;
}

/** Missing package-spec fields after a merge → 400 (calculator needs them). */
const REQUIRED_PACKAGE_FIELDS = [
  "batteryVoltage",
  "batteryCapacityAh",
  "backupHours",
  "recommendedLoadWatt",
] as const;

export function missingPackageFields(values: Record<string, unknown>): string[] {
  if (values.category !== "package") return [];
  return REQUIRED_PACKAGE_FIELDS.filter(
    (f) => values[f] === undefined || values[f] === null,
  );
}
