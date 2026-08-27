import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getOrderWithDetails } from "@/lib/queries";
import { formatDateTime, formatPrice } from "@/lib/format";
import { updateOrderStatus } from "../actions";

export const metadata = { title: "Order Detail | SunVolt Admin" };

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "installed",
  "completed",
  "cancelled",
] as const;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { updated } = await searchParams;
  const result = await getOrderWithDetails(id);
  if (!result) notFound();

  const { order, product, items, appliances } = result;
  const lineItems =
    items.length > 0
      ? items
      : product
        ? [
            {
              id: "legacy",
              productName: product.name,
              quantity: order.quantity,
              unitPrice: product.price,
              totalPrice: String(Number(product.price) * order.quantity),
            },
          ]
        : [];

  const info = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 border-b py-2.5 text-sm last:border-b-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-navy">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon">
            <Link href="/admin/orders" aria-label="Back to orders">
              <ArrowLeft aria-hidden />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-navy">
            SV-{order.id.slice(0, 8).toUpperCase()}
          </h1>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold capitalize text-navy">
          {order.status}
        </span>
      </div>

      {updated ? (
        <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">
          Status updated.
        </p>
      ) : null}

      {/* Status update */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="status" className="text-xs text-muted-foreground">
              Update status
            </label>
            <form action={updateOrderStatus} className="mt-1.5 flex gap-2" id="status-form">
              <input type="hidden" name="orderId" value={order.id} />
              <Select name="status" defaultValue={order.status}>
                <SelectTrigger id="status" className="w-full sm:w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" className="font-semibold">
                Save
              </Button>
            </form>
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/orders/${order.id}/invoice`}>
              <FileText aria-hidden />
              Invoice
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a
              href={`https://wa.me/880${order.phone.replace(/^0/, "").replace(/\D/g, "")}?text=${encodeURIComponent(
                `Assalamu Alaikum ${order.customerName}, this is SunVolt. Your order SV-${order.id.slice(0, 8).toUpperCase()} is ${order.status}.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 WhatsApp Customer
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer + order info */}
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-2 font-bold text-navy">Customer</h2>
            {info("Name", order.customerName)}
            {info(
              "Phone",
              <a href={`tel:${order.phone}`} className="text-navy hover:underline">
                {order.phone}
              </a>,
            )}
            {info("District", order.district)}
            {info("Address", order.address)}
            {info("Installation required", order.installationRequired ? "Yes" : "No")}
            {order.notes ? info("Notes", order.notes) : null}
            {info(
              "Placed",
              formatDateTime(order.createdAt),
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-2 font-bold text-navy">Items</h2>
            {lineItems.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 border-b py-2.5 text-sm last:border-b-0">
                <span>
                  {item.productName}{" "}
                  <span className="text-muted-foreground">× {item.quantity}</span>
                </span>
                <span className="font-semibold text-navy">
                  {formatPrice(item.totalPrice)}
                </span>
              </div>
            ))}
            <Separator className="my-3" />
            <div className="flex justify-between text-base font-bold text-navy">
              <span>Total</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculator context (plan §28 — sales staff reference) */}
      {appliances.length > 0 ? (
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-2 font-bold text-navy">Customer's Calculation</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {appliances.map((item) => (
                <li key={item.id}>
                  {item.quantity} × {item.name} ({item.watt}W × {item.quantity} = {item.totalWatt}W)
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-navy">
              <span>Total load: {order.totalLoad}W</span>
              <span>Backup: {order.backupHours}h</span>
              <span>Required energy: {order.requiredEnergy}Wh</span>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
