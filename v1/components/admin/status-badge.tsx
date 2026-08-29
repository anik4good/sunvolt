import type { Order } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** KachaBazar-style tinted status pills (no border, rounded-full). */
const STATUS_STYLES: Record<Order["status"], string> = {
  pending: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  confirmed: "border-transparent bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  processing: "border-transparent bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  installed: "border-transparent bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
  completed: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  cancelled: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: Order["status"];
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[status], className)}>
      {status}
    </Badge>
  );
}

export function ActiveStatusBadge({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        active
          ? "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "border-transparent bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
        className,
      )}
    >
      {active ? "Active" : "Disabled"}
    </Badge>
  );
}
