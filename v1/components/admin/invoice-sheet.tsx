import Image from "next/image";
import { takaInWords } from "@/lib/taka-in-words";

export interface InvoiceLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceSheetProps {
  business: { name: string; phone: string; whatsapp: string; address: string };
  invoiceNo: string;
  /** Website order reference — omit for manually-created invoices. */
  orderNo?: string | null;
  orderDate?: string | null;
  issuedAt: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    district: string;
  };
  remarks?: string | null;
  paymentTerms?: string | null;
  salesPerson?: string | null;
  items: InvoiceLineItem[];
  subtotal: number;
  installation: number;
  grandTotal: number;
  currency: string;
}

function money(amount: number, currency: string): string {
  return `${currency}${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

/**
 * Printable A4 sales invoice, modeled on the classic Bangladeshi
 * retail invoice layout (Star Tech style). Purely presentational so
 * both server pages and future manual-generator flows can render it.
 */
export function InvoiceSheet({
  business,
  invoiceNo,
  orderNo,
  orderDate,
  issuedAt,
  customer,
  remarks,
  paymentTerms,
  salesPerson,
  items,
  subtotal,
  installation,
  grandTotal,
  currency,
}: InvoiceSheetProps) {
  const meta = (
    label: string,
    value: React.ReactNode,
    width = "w-32",
  ) => (
    <div className="flex gap-2 text-[13px] leading-6">
      <span className={`${width} shrink-0 font-semibold text-navy`}>{label}</span>
      <span className="min-w-0 flex-1">{value}</span>
    </div>
  );

  return (
    <div className="invoice-sheet w-full max-w-[820px] mx-auto border-2 border-navy bg-white text-navy shadow-sm">
      {/* ── Letterhead ─────────────────────────────────────────── */}
      <div className="flex items-stretch justify-between gap-4 border-b-2 border-navy px-6 py-4">
        <div className="flex items-center">
          <Image
            src="/logo.png"
            alt={`${business.name} logo`}
            width={150}
            height={43}
            className="h-10 w-auto"
          />
        </div>
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            {business.name}
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-navy/70">
            Solar Power Solutions
          </p>
        </div>
        <div className="w-56 shrink-0 text-right text-[11px] leading-5 text-navy/90">
          {business.address ? <p>{business.address}</p> : null}
          <p>
            Hotline: <span className="font-semibold">{business.phone}</span>
          </p>
          <p>
            WhatsApp: <span className="font-semibold">{business.whatsapp}</span>
          </p>
        </div>
      </div>

      {/* ── Title band ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-navy/60 bg-navy px-6 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-white">
        <span>Sales Invoice</span>
        <span>Original</span>
      </div>

      {/* ── Meta grid ──────────────────────────────────────────── */}
      <div className="grid gap-x-10 gap-y-0.5 border-b border-navy/60 px-6 py-3 sm:grid-cols-2">
        <div className="space-y-0.5">
          {meta("Invoice No.", invoiceNo)}
          {meta("Sold To", customer.name)}
          {meta(
            "Address",
            [customer.address, customer.district].filter(Boolean).join(", ") ||
              "—",
          )}
          {meta("Phone", customer.phone || "—")}
          {meta("Remarks", remarks ?? "—")}
        </div>
        <div className="space-y-0.5">
          {orderNo ? meta("S. Order No.", orderNo) : null}
          {orderDate ? meta("Order Date", orderDate) : null}
          {meta("Invoice Date", issuedAt)}
          {meta("Payment Terms", paymentTerms || "Advance")}
          {meta("Sales Person", salesPerson || "\u00A0")}
        </div>
      </div>

      {/* ── Product table ──────────────────────────────────────── */}
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-navy/60 text-left text-[11px] font-bold uppercase tracking-wider text-navy/80">
            <th className="w-12 px-3 py-2 text-center">Sl.</th>
            <th className="px-3 py-2">Product Description</th>
            <th className="w-16 px-3 py-2 text-center">Qty</th>
            <th className="w-28 px-3 py-2 text-right">Unit Price</th>
            <th className="w-32 px-3 py-2 text-right">Total Price</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-4 text-center text-navy/60">
                No line items recorded for this order.
              </td>
            </tr>
          ) : (
            items.map((item, i) => (
              <tr key={`${item.name}-${i}`} className="border-b border-navy/15">
                <td className="px-3 py-2 text-center">{i + 1}</td>
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2 text-center">{item.quantity}</td>
                <td className="px-3 py-2 text-right">
                  {money(item.unitPrice, currency)}
                </td>
                <td className="px-3 py-2 text-right font-medium">
                  {money(item.total, currency)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ── Totals + amount in words ───────────────────────────── */}
      <div className="grid gap-4 border-y border-navy/60 px-6 py-3 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-navy/70">
            In Word
          </p>
          <p className="mt-1 text-[13px] font-medium">{takaInWords(grandTotal)}</p>
        </div>
        <div className="space-y-1 text-right text-[13px] sm:w-64">
          <div className="flex justify-between gap-6">
            <span className="text-navy/70">Sub Total</span>
            <span>{money(subtotal, currency)}</span>
          </div>
          {installation > 0 ? (
            <div className="flex justify-between gap-6">
              <span className="text-navy/70">Installation</span>
              <span>{money(installation, currency)}</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-6 border-t border-navy/60 pt-1 text-base font-bold">
            <span>G. Total</span>
            <span>{money(grandTotal, currency)}</span>
          </div>
        </div>
      </div>

      {/* ── Signatures ─────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-8 px-6 pb-2 pt-14">
        <div className="w-56 border-t border-navy/60 pt-1 text-center text-[12px] font-medium">
          Signature of Customer
        </div>
        <div className="w-56 text-center text-[12px] font-medium">
          <p className="font-semibold">for {business.name}</p>
          <div className="mt-12 border-t border-navy/60 pt-1">
            Authorized Signature
          </div>
        </div>
      </div>

      {/* ── Footer notes ───────────────────────────────────────── */}
      <div className="border-t border-navy/60 px-6 py-2.5 text-[10px] leading-4 text-navy/70">
        <ul className="list-inside list-disc space-y-0.5">
          <li>
            Goods once sold are not returnable; warranty claims are serviced per
            each product&apos;s warranty terms.
          </li>
          <li>
            Installation warranty covers workmanship only and excludes damage
            from misuse, tampering, or natural disasters.
          </li>
          <li>
            {orderNo
              ? `This is a computer-generated invoice generated from order ${orderNo}.`
              : "This is a computer-generated invoice."}
          </li>
        </ul>
      </div>
    </div>
  );
}
