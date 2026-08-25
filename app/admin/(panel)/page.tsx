import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import {
  ClipboardList,
  Clock,
  Package,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Dashboard | SunVolt Admin" };

async function count(query: Promise<{ value: number }[]>) {
  const rows = await query;
  return rows[0]?.value ?? 0;
}

export default async function AdminDashboardPage() {
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    completedOrders,
    activePackages,
    recent,
    revenueRows,
  ] = await Promise.all([
    count(db.select({ value: sql<number>`count(*)::int` }).from(orders)),
    count(
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(orders)
        .where(eq(orders.status, "pending")),
    ),
    count(
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(orders)
        .where(sql`${orders.status} in ('confirmed','processing')`),
    ),
    count(
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(orders)
        .where(eq(orders.status, "completed")),
    ),
    count(
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(products)
        .where(eq(products.active, true)),
    ),
    db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        phone: orders.phone,
        totalPrice: orders.totalPrice,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5),
    db
      .select({ value: sql<number>`coalesce(sum(total_price), 0)::float` })
      .from(orders)
      .where(sql`${orders.status} <> 'cancelled'`),
  ]);

  const cards = [
    { label: "Total Orders", value: totalOrders, icon: ClipboardList },
    { label: "Pending", value: pendingOrders, icon: Clock },
    { label: "Confirmed / Processing", value: confirmedOrders, icon: CheckCircle2 },
    { label: "Completed", value: completedOrders, icon: CheckCircle2 },
    { label: "Active Packages", value: activePackages, icon: Package },
    {
      label: "Order Value (not cancelled)",
      value: formatPrice(revenueRows[0]?.value ?? 0),
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/products/new">+ New Product</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-solar-light text-solar-dark">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-extrabold text-navy">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-navy hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="hidden px-4 py-3 sm:table-cell">Phone</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recent.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold text-navy hover:underline"
                      >
                        SV-{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {order.phone}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatPrice(order.totalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={
                          order.status === "pending"
                            ? "border-solar text-solar-dark"
                            : order.status === "cancelled"
                              ? "border-destructive text-destructive"
                              : "border-leaf text-leaf"
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
