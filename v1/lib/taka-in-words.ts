/**
 * Amount-in-words for invoices (Bangladeshi convention):
 * South-Asian grouping (crore / lakh / thousand) with "Taka" and
 * optional "Paisa", e.g. 18750.5 → "Eighteen Thousand Seven Hundred
 * Fifty Taka and Fifty Paisa Only".
 */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function underHundred(n: number): string {
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const ones = ONES[n % 10];
  return ones ? `${tens} ${ones}` : tens;
}

function underThousand(n: number): string {
  if (n < 100) return underHundred(n);
  const hundreds = `${ONES[Math.floor(n / 100)]} Hundred`;
  const rest = n % 100;
  return rest ? `${hundreds} ${underHundred(rest)}` : hundreds;
}

/** Integer 0–99,99,99,999 → words with crore/lakh/thousand grouping. */
function intToWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1_00_00_000);
  const lakh = Math.floor((n % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((n % 1_00_000) / 1_000);
  const rest = n % 1_000;
  if (crore) parts.push(`${underThousand(crore)} Crore`);
  if (lakh) parts.push(`${underThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${underThousand(thousand)} Thousand`);
  if (rest) parts.push(underThousand(rest));
  return parts.join(" ");
}

export function takaInWords(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  const cents = Math.round(Number(amount) * 100);
  if (!Number.isFinite(cents)) return "";
  const taka = Math.floor(cents / 100);
  const paisa = cents % 100;
  let text = `${intToWords(taka)} Taka`;
  if (paisa > 0) text += ` and ${intToWords(paisa)} Paisa`;
  return `${text} Only`;
}
