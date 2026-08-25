import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getOrderWithDetails, getSettings } from "@/lib/queries";
import {
  InvoiceSheet,
  type InvoiceLineItem,
} from "@/components/admin/invoice-sheet";
import { InvoiceToolbar } from "@/components/admin/invoice-toolbar";

export const metadata = { title: "Invoice | SunVolt Admin" };

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Standalone printable invoice for an order. Lives in the (print)
 * group so it renders without the admin sidebar — the whole page is
 * the invoice sheet plus a screen-only toolbar.
 */
export default async function OrderInvoicePage({
  params,
}: PageProps<"/admin/orders/[id]/invoice">) {
  await requireAdmin();
  const { id } = await params;
  const result = await getOrderWithDetails(id);
  if (!result) notFound();

  const { order, product, items } = result;
  const settings = await getSettings();

  const lineItems: InvoiceLineItem[] =
    items.length > 0
      ? items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          total: Number(item.totalPrice),
        }))
      : product
        ? [
            {
              name: product.name,
              quantity: order.quantity,
              unitPrice: Number(product.price),
              total: Number(product.price) * order.quantity,
            },
          ]
        : [];

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  // Checkout stores the grand total (items + installation) on the
  // order; the difference is the installation charge.
  const grandTotal =
    order.totalPrice !== null ? Number(order.totalPrice) : subtotal;
  const installation = Math.max(0, grandTotal - subtotal);
  if (installation > 0) {
    lineItems.push({
      name: "Installation & Commissioning Service",
      quantity: 1,
      unitPrice: installation,
      total: installation,
    });
  }

  const orderCode = `SV-${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-secondary/40 print:bg-white">
      <InvoiceToolbar
        backHref={`/admin/orders/${order.id}`}
        backLabel="Back to order"
      />
      <div className="px-4 pb-10 print:p-0">
        <InvoiceSheet
          business={{
            name: settings.businessName,
            phone: settings.phone,
            whatsapp: settings.whatsapp,
            address: settings.address,
          }}
          invoiceNo={`INV-${order.id.slice(0, 8).toUpperCase()}`}
          orderNo={orderCode}
          orderDate={formatDate(order.createdAt)}
          issuedAt={formatDate(new Date())}
          customer={{
            name: order.customerName,
            phone: order.phone,
            address: order.address,
            district: order.district,
          }}
          remarks={order.notes}
          items={lineItems}
          subtotal={subtotal}
          installation={installation}
          grandTotal={grandTotal}
          currency={settings.currency}
        />
      </div>
    </div>
  );
}
