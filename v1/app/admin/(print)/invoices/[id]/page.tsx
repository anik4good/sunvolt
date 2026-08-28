import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getInvoiceWithItems, getSettings } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { InvoiceSheet } from "@/components/admin/invoice-sheet";
import { InvoiceToolbar } from "@/components/admin/invoice-toolbar";

export const metadata = { title: "Invoice | SunVolt Admin" };

/**
 * Printable view of a manually-created invoice. Lives in the (print)
 * group so it renders without the admin sidebar — the whole page is
 * the invoice sheet plus a screen-only toolbar.
 */
export default async function CustomInvoicePage({
  params,
}: PageProps<"/admin/invoices/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const result = await getInvoiceWithItems(id);
  if (!result) notFound();

  const { invoice, items } = result;
  const settings = await getSettings();

  const lineItems = items.map((item) => ({
    name: item.description,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    total: Number(item.totalPrice),
  }));
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = Number(invoice.totalAmount);

  return (
    <div className="min-h-screen bg-secondary/40 print:bg-white">
      <InvoiceToolbar backHref="/admin/invoices" backLabel="Back to invoices" />
      <div className="px-4 pb-10 print:p-0">
        <InvoiceSheet
          business={{
            name: settings.businessName,
            phone: settings.phone,
            whatsapp: settings.whatsapp,
            address: settings.address,
          }}
          invoiceNo={invoice.invoiceNo}
          issuedAt={formatDate(invoice.createdAt)}
          customer={{
            name: invoice.customerName,
            phone: invoice.phone ?? "",
            address: invoice.address ?? "",
            district: invoice.district ?? "",
          }}
          remarks={invoice.notes}
          paymentTerms={invoice.paymentTerms}
          salesPerson={invoice.salesPerson}
          items={lineItems}
          subtotal={subtotal}
          installation={0}
          grandTotal={grandTotal}
          currency={settings.currency}
        />
      </div>
    </div>
  );
}
