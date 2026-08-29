"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Order } from "@/db/schema";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--popover-foreground)",
  fontSize: "12px",
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
} as const;

export interface RevenuePoint {
  month: string;
  revenue: number;
  orders: number;
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-[280px] w-full" role="img" aria-label="Monthly revenue for the last 6 months">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
            }
          />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: "var(--muted-foreground)", marginBottom: 4 }}
            formatter={(value) => [formatPrice(Number(value)), "Revenue"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#revenueFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface StatusSlice {
  status: Order["status"];
  count: number;
}

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "#f59e0b",
  confirmed: "#0ea5e9",
  processing: "#6366f1",
  installed: "#14b8a6",
  completed: "#10b981",
  cancelled: "#ef4444",
};

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  installed: "Installed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function OrdersStatusChart({ data }: { data: StatusSlice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[210px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        No orders yet — statuses will appear here.
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-[210px] w-full" role="img" aria-label="Orders by status">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => [`${formatNumber(Number(value))} orders`, String(name)]}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              strokeWidth={2}
              stroke="var(--card)"
            >
              {data.map((slice) => (
                <Cell key={slice.status} fill={STATUS_COLORS[slice.status]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight">{formatNumber(total)}</span>
          <span className="text-xs text-muted-foreground">orders</span>
        </div>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((slice) => (
          <li key={slice.status} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: STATUS_COLORS[slice.status] }}
              aria-hidden
            />
            <span className="truncate text-muted-foreground">{STATUS_LABELS[slice.status]}</span>
            <span className={cn("ml-auto font-semibold")}>{slice.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
