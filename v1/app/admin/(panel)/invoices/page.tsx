import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { Plus, Printer, Trash2 } from "lucide-react";
import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/admin/delete-button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { formatDate, formatPrice } from "@/lib/format";
import { deleteInvoice } from "./actions";

export const metadata = { title: "Invoices | SunVolt Admin" };

interface PageProps {
  searchParams: Promise<{ deleted?: string }>;
}

export default async function AdminInvoicesPage({ searchParams }: PageProps) {
  const { deleted } = await searchParams;

  const rows = await db
    .select()
    .from(invoices)
    .orderBy(desc(invoices.createdAt))
    .limit(200);

  const counts = await db
    .select({ invoiceId: invoiceItems.invoiceId, value: sql<number>`count(*)::int` })
    .from(invoiceItems)
    .groupBy(invoiceItems.invoiceId);
  const countByInvoice = new Map(counts.map((c) => [c.invoiceId, c.value]));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Invoices"
        description="Manually-created invoices for orders taken outside the website."
        actions={
          <Button asChild className="font-semibold">
            <Link href="/admin/invoices/new">
              <Plus aria-hidden />
              New Invoice
            </Link>
          </Button>
        }
      />

      {deleted ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
          Invoice deleted.
        </p>
      ) : null}

      <Card className="gap-0 py-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No invoices yet. Create one for a phone or walk-in order.
                </td>
              </tr>
            ) : (
              rows.map((invoice) => (
                <tr key={invoice.id} className="border-t hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/invoices/${invoice.id}`}
                      className="font-semibold hover:underline"
                    >
                      {invoice.invoiceNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{invoice.customerName}</div>
                    {invoice.phone ? (
                      <div className="text-xs text-muted-foreground">{invoice.phone}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {countByInvoice.get(invoice.id) ?? 0}{" "}
                      {(countByInvoice.get(invoice.id) ?? 0) === 1 ? "item" : "items"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">
                    {formatPrice(invoice.totalAmount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDate(invoice.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/invoices/${invoice.id}`}>
                          <Printer aria-hidden />
                          Print
                        </Link>
                      </Button>
                      <DeleteButton
                        label="Delete"
                        confirmText={`Delete invoice ${invoice.invoiceNo}? This cannot be undone.`}
                        action={deleteInvoice}
                        id={invoice.id}
                        icon={<Trash2 className="size-4" aria-hidden />}
                      />
                    </div>
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
