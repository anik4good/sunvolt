import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { json, withApiKey } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/v1/stats — dashboard overview for AI-driven management. */
export const GET = withApiKey(async () => {
  const [orderCounts, activeProducts, revenueRows, recent, lowStock] = await Promise.all([
    db
      .select({ status: orders.status, value: sql<number>`count(*)::int` })
      .from(orders)
      .groupBy(orders.status),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.active, true)),
    db
      .select({ value: sql<number>`coalesce(sum(total_price), 0)::float` })
      .from(orders)
      .where(sql`${orders.status} <> 'cancelled'`),
    db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        phone: orders.phone,
        status: orders.status,
        totalPrice: orders.totalPrice,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5),
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        stock: products.stock,
        price: products.price,
      })
      .from(products)
      .where(sql`${products.active} = true and ${products.stock} <= 3`)
      .orderBy(products.stock)
      .limit(20),
  ]);

  const byStatus = Object.fromEntries(orderCounts.map((r) => [r.status, r.value]));
  const pending = byStatus.pending ?? 0;
  const confirmed = (byStatus.confirmed ?? 0) + (byStatus.processing ?? 0);
  const completed = byStatus.completed ?? 0;
  const cancelled = byStatus.cancelled ?? 0;
  const total = orderCounts.reduce((sum, r) => sum + r.value, 0);

  return json({
    orders: { total, pending, confirmed, completed, cancelled, installed: byStatus.installed ?? 0 },
    activeProducts: activeProducts[0]?.value ?? 0,
    orderValue: revenueRows[0]?.value ?? 0,
    recentOrders: recent.map((o) => ({
      ...o,
      totalPrice: o.totalPrice === null ? null : Number(o.totalPrice),
    })),
    lowStock: lowStock.map((p) => ({ ...p, price: Number(p.price) })),
  });
});
