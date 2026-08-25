import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { getSettings } from "@/lib/queries";

export const metadata = { title: "New Invoice | SunVolt Admin" };

export default async function NewInvoicePage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon">
          <Link href="/admin/invoices" aria-label="Back to invoices">
            <ArrowLeft aria-hidden />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-navy">New Invoice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            For orders received manually — the next sequential invoice number is
            assigned on save.
          </p>
        </div>
      </div>

      <InvoiceForm currency={settings.currency} />
    </div>
  );
}
