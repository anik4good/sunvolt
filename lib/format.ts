/**
 * Formatting helpers for customer-facing numbers.
 * Prices keep Western digits (৳18,700 style, as in plan.md);
 * Bangladeshi digit grouping matches en-IN (1,00,000).
 */

export function formatPrice(
  amount: string | number | null | undefined,
  currency = "৳",
): string {
  if (amount === null || amount === undefined) return "—";
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "—";
  return `${currency}${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function formatWatt(watt: number | null | undefined): string {
  return watt === null || watt === undefined ? "—" : `${watt}W`;
}

export function formatWh(wh: number | null | undefined): string {
  return wh === null || wh === undefined ? "—" : `${Math.round(wh)}Wh`;
}

export function formatHours(hours: number | null | undefined): string {
  return hours === null || hours === undefined ? "—" : `${hours} ঘণ্টা`;
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Convert Western digits to Bengali numerals: 12 → ১২ */
export function toBn(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}
