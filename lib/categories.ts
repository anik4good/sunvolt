/**
 * Product catalog categories (individual products — NOT backup packages).
 * `package` is reserved for custom combo packages and is not in this list.
 */
export const PRODUCT_CATEGORIES = [
  { slug: "solar-inverter", label: "Solar Inverter" },
  { slug: "bms", label: "BMS" },
  { slug: "solar-panel", label: "Solar Panel" },
  { slug: "inverter", label: "Inverter" },
  { slug: "diy-solar", label: "DIY Solar" },
  { slug: "mppt-charger", label: "MPPT Charger" },
  { slug: "dc-charger", label: "DC Charger" },
  { slug: "accessories", label: "Accessories" },
  { slug: "battery", label: "Battery" },
] as const;

export type ProductCategorySlug = (typeof PRODUCT_CATEGORIES)[number]["slug"];

export function categoryLabel(slug: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export const PACKAGE_CATEGORY = "package";
