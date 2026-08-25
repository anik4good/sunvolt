import type { Order } from "@/db/schema";

export const ORDER_STATUS_LABELS: Record<Order["status"], string> = {
  pending: "অপেক্ষমাণে",
  confirmed: "নিশ্চিত",
  processing: "প্রসেসিং",
  installed: "ইনস্টলড",
  completed: "সম্পন্ন",
  cancelled: "বাতিল",
};

export function orderStatusColor(status: Order["status"]): string {
  switch (status) {
    case "pending":
      return "bg-solar-light text-solar-dark";
    case "confirmed":
    case "processing":
      return "bg-navy/10 text-navy";
    case "installed":
    case "completed":
      return "bg-leaf/15 text-leaf";
    case "cancelled":
      return "bg-destructive/10 text-destructive";
  }
}
