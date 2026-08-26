import { z } from "zod";

/**
 * Zod schemas for the /api/v1 management API (JSON bodies — see
 * DEVELOPERS.md). Separate from the admin form schemas because the API
 * accepts native JSON (records/arrays) instead of textarea blobs.
 */

export const CATEGORY_SLUGS = [
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

const nullableTrim = (max: number) =>
  z.string().trim().max(max).nullable().optional();

const optionalInt = (min: number, max: number) =>
  z.number().int().min(min).max(max).nullable().optional();

const optionalAmount = (max: number) => z.number().min(0).max(max).nullable().optional();

const stringList = (maxLen: number) =>
  z.array(z.string().trim().min(1).max(maxLen)).max(30).nullable().optional();

const recordField = () =>
  z.record(z.string().trim().min(1).max(120), z.string().trim().max(2000))
    .nullable()
    .optional();

/** Supplier cost: simple per-piece BDT, or the imported Alibaba USD ladder. */
const costPrice = z
  .union([
    z.object({ perPiece: z.number().min(0).max(10_000_000) }),
    z.object({
      moq: z.number().int().min(1),
      currency: z.string().trim().min(1).max(8),
      ladder: z
        .array(
          z.object({
            qtyMin: z.number().int().min(1),
            qtyMax: z.number().int().min(1).nullable().optional(),
            priceUsd: z.number().min(0),
          }),
        )
        .min(1)
        .max(20),
    }),
  ])
  .nullable()
  .optional();

/** All mutable product fields, no defaults — PATCH sends only these. */
const productFields = {
  name: z.string().trim().min(2).max(120),
  nameBn: nullableTrim(160),
  category: z.enum(CATEGORY_SLUGS),
  slug: z.string().trim().min(1).max(120).nullable().optional(),
  description: nullableTrim(2000),
  brand: nullableTrim(80),
  model: nullableTrim(80),
  specs: recordField(),
  features: stringList(300),
  highlights: stringList(300),
  packaging: recordField(),
  images: z.array(z.string().trim().min(1).max(500)).max(10).nullable().optional(),
  costPrice,
  sourceUrl: nullableTrim(500),
  panelVoltage: optionalInt(1, 1000),
  batteryVoltage: optionalInt(0, 1000),
  batteryCapacityAh: optionalInt(0, 10000),
  batteryType: nullableTrim(60),
  solarPanelWatt: optionalInt(0, 100000),
  controllerWatt: optionalInt(0, 100000),
  backupHours: optionalInt(0, 200),
  recommendedLoadWatt: optionalInt(0, 100000),
  exampleFanCount: optionalInt(0, 20),
  exampleLightCount: optionalInt(0, 30),
  price: optionalAmount(10_000_000),
  discountPct: z.number().int().min(0).max(90).nullable().optional(),
  installationPrice: optionalAmount(10_000_000),
  warrantyMonths: optionalInt(0, 360),
  stock: optionalInt(0, 100000),
  active: z.boolean().nullable().optional(),
  featured: z.boolean().nullable().optional(),
};

const PACKAGE_REQUIRED = [
  "batteryVoltage",
  "batteryCapacityAh",
  "backupHours",
  "recommendedLoadWatt",
] as const;

/** Packages must carry their full spec so the calculator can use them. */
function refinePackage<T extends { category: string }>(
  data: T,
  ctx: z.RefinementCtx,
  has: (field: string) => boolean,
): void {
  if (data.category !== "package") return;
  for (const field of PACKAGE_REQUIRED) {
    if (!has(field)) {
      ctx.addIssue({
        code: "custom",
        path: [field],
        message: `Required for category "package"`,
      });
    }
  }
}

export const productCreateSchema = z
  .object({
    ...productFields,
    category: productFields.category.default("package"),
    discountPct: productFields.discountPct.default(0),
    warrantyMonths: productFields.warrantyMonths.default(6),
    stock: productFields.stock.default(0),
    active: productFields.active.default(true),
    featured: productFields.featured.default(false),
  })
  .superRefine((data, ctx) =>
    refinePackage(data, ctx, (f) => {
      const v = data[f as keyof typeof data];
      return v !== undefined && v !== null;
    }),
  );

export const productUpdateSchema = z.object(productFields).partial();

const applianceFields = {
  name: z.string().trim().min(1).max(60),
  category: z.string().trim().min(1).max(40),
  defaultWatt: z.number().int().min(1).max(2000),
  icon: z.string().trim().min(1).max(8),
  active: z.boolean(),
};

export const applianceCreateSchema = z.object({
  ...applianceFields,
  category: applianceFields.category.default("general"),
  icon: applianceFields.icon.default("🔌"),
  active: applianceFields.active.default(true),
});

export const applianceUpdateSchema = z.object(applianceFields).partial();

/** Validate UUID shape (used to decide id vs slug lookup). */
export function isUuid(value: string): boolean {
  return z.uuid().safeParse(value).success;
}
