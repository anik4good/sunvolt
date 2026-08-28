/**
 * Product catalog categories (individual products — NOT backup packages).
 * `package` is reserved for custom combo packages and is not in this list.
 */
export const PRODUCT_CATEGORIES = [
  { slug: "solar-inverter", label: "Solar Inverter", labelBn: "সোলার ইনভার্টার", icon: "🔄" },
  { slug: "bms", label: "BMS", labelBn: "BMS", icon: "🧠" },
  { slug: "solar-panel", label: "Solar Panel", labelBn: "সোলার প্যানেল", icon: "☀️" },
  { slug: "inverter", label: "Inverter", labelBn: "Inverter", icon: "🔌" },
  { slug: "diy-solar", label: "DIY Solar", labelBn: "DIY Solar", icon: "🧰" },
  { slug: "mppt-charger", label: "MPPT Charger", labelBn: "MPPT Charger", icon: "⚡" },
  { slug: "dc-charger", label: "DC Charger", labelBn: "DC Charger", icon: "🔌" },
  { slug: "accessories", label: "Accessories", labelBn: "এক্সেসরিজ", icon: "🎛️" },
  { slug: "battery", label: "Battery", labelBn: "ব্যাটারি", icon: "🔋" },
  { slug: "fan", label: "Fan", labelBn: "ফ্যান", icon: "🌀" },
] as const;

export type ProductCategorySlug = (typeof PRODUCT_CATEGORIES)[number]["slug"];

/** Minimal shape client components need to render category choices. */
export type CategoryOption = { slug: string; label: string };

export function categoryLabel(slug: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function categoryLabelBn(slug: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.slug === slug)?.labelBn ?? slug;
}

export function categoryIcon(slug: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.slug === slug)?.icon ?? "⚡";
}

export const PACKAGE_CATEGORY = "package";
