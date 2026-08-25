import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { FileText } from "lucide-react";
import { db } from "@/db";
import { orders, type Order } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Orders | SunVolt Admin" };

const FILTERS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "installed",
  "completed",
  "cancelled",
] as const;

function statusClass(status: string): string {
  switch (status) {
    case "pending":
      return "border-solar text-solar-dark";
    case "cancelled":
      return "border-destructive text-destructive";
    case "completed":
    case "installed":
      return "border-leaf text-leaf";
    default:
      return "border-navy text-navy";
  }
}

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const filter = FILTERS.includes((status ?? "all") as (typeof FILTERS)[number])
    ? (status ?? "all")
    : "all";
  const statusFilter = filter === "all" ? null : (filter as Order["status"]);

  const rows = await (statusFilter
    ? db
        .select()
        .from(orders)
        .where(eq(orders.status, statusFilter))
        .orderBy(desc(orders.createdAt))
        .limit(200)
    : db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200));

  const counts = await db
    .select({ status: orders.status, value: sql<number>`count(*)::int` })
    .from(orders)
    .groupBy(orders.status);
  const countByStatus = new Map(counts.map((c) => [c.status, c.value]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Orders</h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f === "all"
            ? [...countByStatus.values()].reduce((a, b) => a + b, 0)
            : (countByStatus.get(f) ?? 0);
          return (
            <Link
              key={f}
              href={`/admin/orders${f === "all" ? "" : `?status=${f}`}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                filter === f
                  ? "border-navy bg-navy text-white"
                  : "bg-background text-navy/70 hover:bg-secondary",
              )}
            >
              {f} ({count})
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">District</th>
              <th className="px-4 py-3">Load / Backup</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3 text-right">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No orders{filter !== "all" ? ` with status “${filter}”` : ""}.
                </td>
              </tr>
            ) : (
              rows.map((order) => (
                <tr key={order.id} className="border-t hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-semibold text-navy hover:underline"
                    >
                      SV-{order.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.customerName}</div>
                    <a
                      href={`https://wa.me/880${order.phone.replace(/^0/, "").replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-whatsapp hover:underline"
                    >
                      {order.phone} 💬
                    </a>
                  </td>
                  <td className="px-4 py-3">{order.district}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {order.totalLoad ? `${order.totalLoad}W` : "—"}
                    {order.backupHours ? ` / ${order.backupHours}h` : ""}
                  </td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">
                    {formatPrice(order.totalPrice)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("capitalize", statusClass(order.status))}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {order.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}/invoice`}
                      aria-label={`Invoice for SV-${order.id.slice(0, 8).toUpperCase()}`}
                      title="Generate invoice"
                      className="inline-flex size-8 items-center justify-center rounded-lg border bg-background text-navy/70 transition-colors hover:bg-secondary hover:text-navy"
                    >
                      <FileText className="size-4" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
