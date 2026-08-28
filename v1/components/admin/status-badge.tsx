import type { Order } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<Order["status"], string> = {
  pending:
    "border-solar/60 bg-solar-light text-solar-dark dark:border-solar/40 dark:bg-solar/15 dark:text-solar",
  confirmed: "border-primary/30 bg-primary/10 text-primary",
  processing: "border-primary/30 bg-primary/10 text-primary",
  installed: "border-leaf/50 bg-leaf/10 text-leaf",
  completed: "border-leaf/50 bg-leaf/10 text-leaf",
  cancelled: "border-destructive/40 bg-destructive/10 text-destructive",
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
          ? "border-leaf/50 bg-leaf/10 text-leaf"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {active ? "active" : "disabled"}
    </Badge>
  );
}
