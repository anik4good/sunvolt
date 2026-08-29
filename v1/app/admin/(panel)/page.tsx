import Link from "next/link";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import {
  Banknote,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock,
  LoaderCircle,
  Package,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { db } from "@/db";
import { orders, products, type Order } from "@/db/schema";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { RevenueChart, OrdersStatusChart } from "@/components/admin/dashboard-charts";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard | SunVolt Admin" };

const SITE_TIME_ZONE = "Asia/Dhaka";
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-08" for a date, pinned to the site timezone. */
function monthKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: SITE_TIME_ZONE,
  }).format(date);
}

function percentDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

async function count(query: Promise<{ value: number }[]>) {
  const rows = await query;
  return rows[0]?.value ?? 0;
}

export default async function AdminDashboardPage() {
  // Current month in site time, then the UTC instant 6 months back for the chart window.
  const [yearStr, monthStr] = monthKey(new Date()).split("-");
  const windowStart = new Date(
    Date.UTC(Number(yearStr), Number(monthStr) - 6, 1),
  );

  const [statusCounts, activePackages, activeProducts, recent, revenueRows, monthlyRows] =
    await Promise.all([
      db
        .select({ status: orders.status, value: sql<number>`count(*)::int` })
        .from(orders)
        .groupBy(orders.status),
      count(
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(products)
          .where(and(eq(products.active, true), eq(products.category, "package"))),
      ),
      count(
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(products)
          .where(and(eq(products.active, true), ne(products.category, "package"))),
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
      db
        .select({ createdAt: orders.createdAt, totalPrice: orders.totalPrice, status: orders.status })
        .from(orders)
        .where(gte(orders.createdAt, windowStart)),
    ]);

  const countByStatus = new Map(statusCounts.map((c) => [c.status, c.value]));
  const statusOf = (s: Order["status"]) => countByStatus.get(s) ?? 0;
  const totalOrders = statusCounts.reduce((sum, c) => sum + c.value, 0);
  const inProgress = statusOf("confirmed") + statusOf("processing");
  const revenue = revenueRows[0]?.value ?? 0;

  // Last 6 monthly buckets (oldest → newest), cancelled orders excluded.
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1 - (5 - i), 1));
    return {
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      month: MONTH_NAMES[d.getUTCMonth()],
      revenue: 0,
      orders: 0,
    };
  });
  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));
  for (const row of monthlyRows) {
    if (row.status === "cancelled") continue;
    const bucket = bucketByKey.get(monthKey(row.createdAt));
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.revenue += Number(row.totalPrice);
  }
  const current = buckets[5];
  const previous = buckets[4];
  const ordersDelta = percentDelta(current.orders, previous.orders);
  const revenueDelta = percentDelta(current.revenue, previous.revenue);

  const cards = [
    { label: "Total Orders", value: formatNumber(totalOrders), icon: ClipboardList, delta: ordersDelta },
    { label: "Pending", value: formatNumber(statusOf("pending")), icon: Clock },
    { label: "In Progress", value: formatNumber(inProgress), icon: LoaderCircle },
    { label: "Completed", value: formatNumber(statusOf("completed")), icon: CheckCircle2 },
    { label: "Cancelled", value: formatNumber(statusOf("cancelled")), icon: XCircle },
    { label: "Active Packages", value: formatNumber(activePackages), icon: Package },
    { label: "Active Products", value: formatNumber(activeProducts), icon: Boxes },
    { label: "Total Revenue", value: formatPrice(revenue), icon: Banknote, delta: revenueDelta },
  ];

  const donutData = statusCounts
    .map((c) => ({ status: c.status, count: c.value }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Store performance at a glance."
        actions={
          <Button asChild size="sm" className="font-semibold">
            <Link href="/admin/products/new">+ Add Product</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-1 truncate text-2xl font-bold tracking-tight">
                      {card.value}
                    </p>
                    {card.delta !== undefined && card.delta !== null ? (
                      <p
                        className={cn(
                          "mt-1.5 inline-flex items-center gap-1 text-xs font-medium",
                          card.delta >= 0 ? "text-leaf" : "text-destructive",
                        )}
                      >
                        {card.delta >= 0 ? (
                          <TrendingUp className="size-3" aria-hidden />
                        ) : (
                          <TrendingDown className="size-3" aria-hidden />
                        )}
                        {Math.abs(card.delta)}%
                        <span className="font-normal text-muted-foreground">vs last month</span>
                      </p>
                    ) : null}
                  </div>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                    <Icon className="size-5" aria-hidden />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Last 6 months, cancelled orders excluded.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={buckets} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>All-time distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersStatusChart data={donutData} />
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b [.border-b]:pb-4">
          <CardTitle>Recent Orders</CardTitle>
          <CardAction>
            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all →
            </Link>
          </CardAction>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="hidden px-4 py-3 sm:table-cell">Phone</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 sm:table-cell">Placed</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recent.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold hover:underline"
                      >
                        SV-{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium">{order.customerName}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {order.phone}
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {formatPrice(order.totalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap text-muted-foreground sm:table-cell">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
