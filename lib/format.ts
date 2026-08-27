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

/**
 * Deterministic date/time/number formatting for shared (server + client)
 * components. Locale- and timezone-dependent built-ins like
 * `date.toLocaleDateString()` render different strings on the server (UTC)
 * and in the browser (Asia/Dhaka), which breaks hydration and can leave the
 * page stuck re-rendering. These helpers pin both locale and timezone so
 * server and client always agree, byte for byte.
 */

const SITE_TIME_ZONE = "Asia/Dhaka";

export function formatDate(
  date: Date | string | number | null | undefined,
): string {
  if (date === null || date === undefined) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: SITE_TIME_ZONE,
  }).format(d);
}

export function formatDateTime(
  date: Date | string | number | null | undefined,
): string {
  if (date === null || date === undefined) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SITE_TIME_ZONE,
  }).format(d);
}

/** Grouped number without currency symbol (en-IN grouping: 1,00,000). */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    value,
  );
}
