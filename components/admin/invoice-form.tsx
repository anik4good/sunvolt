"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import {
  createInvoice,
  type InvoiceFormState,
} from "@/app/admin/(panel)/invoices/actions";

interface Row {
  description: string;
  quantity: string;
  unitPrice: string;
}

const EMPTY_ROW: Row = { description: "", quantity: "1", unitPrice: "" };

/**
 * Free-form invoice editor for sales taken outside the website
 * (phone / walk-in). Item rows are edited client-side, serialized to
 * JSON, and re-validated + priced server-side in createInvoice.
 */
export function InvoiceForm({ currency }: { currency: string }) {
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY_ROW }]);
  const [state, formAction, pending] = useActionState<InvoiceFormState | undefined, FormData>(
    createInvoice,
    undefined,
  );

  const items = rows
    .filter((r) => r.description.trim().length > 0 && r.unitPrice !== "")
    .map((r) => ({
      description: r.description.trim(),
      quantity: Math.max(1, Math.floor(Number(r.quantity) || 1)),
      unitPrice: Math.max(0, Number(r.unitPrice) || 0),
    }));
  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const update = (index: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const removeRow = (index: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="customerName">Customer name *</Label>
            <Input
              id="customerName"
              name="customerName"
              required
              maxLength={80}
              placeholder="e.g. Rahim Uddin"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              maxLength={20}
              placeholder="017XXXXXXXX"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="district">District</Label>
            <Input id="district" name="district" maxLength={50} placeholder="Dhaka" className="mt-1.5" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              maxLength={250}
              placeholder="House, road, area"
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="font-bold text-navy">Items</h2>
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={index} className="flex flex-wrap items-end gap-2">
                <div className="min-w-48 flex-1">
                  {index === 0 ? (
                    <Label htmlFor="item-desc-0">Description</Label>
                  ) : null}
                  <Input
                    id={`item-desc-${index}`}
                    value={row.description}
                    onChange={(e) => update(index, { description: e.target.value })}
                    maxLength={200}
                    placeholder="e.g. 100Ah LiFePO4 Battery"
                    className="mt-1.5"
                  />
                </div>
                <div className="w-20">
                  {index === 0 ? <Label htmlFor="item-qty-0">Qty</Label> : null}
                  <Input
                    id={`item-qty-${index}`}
                    type="number"
                    min={1}
                    step={1}
                    value={row.quantity}
                    onChange={(e) => update(index, { quantity: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div className="w-32">
                  {index === 0 ? <Label htmlFor="item-price-0">Unit price</Label> : null}
                  <Input
                    id={`item-price-${index}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.unitPrice}
                    onChange={(e) => update(index, { unitPrice: e.target.value })}
                    placeholder="0"
                    className="mt-1.5"
                  />
                </div>
                <div className="w-24 pb-2 text-right text-sm font-semibold text-navy">
                  {row.unitPrice === "" ? "" : formatPrice(
                      (Number(row.unitPrice) || 0) * Math.max(1, Math.floor(Number(row.quantity) || 1)),
                      currency,
                    )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Remove item ${index + 1}`}
                  onClick={() => removeRow(index)}
                  disabled={rows.length === 1}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setRows((p) => [...p, { ...EMPTY_ROW }])}>
            <Plus aria-hidden />
            Add item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="paymentTerms">Payment terms</Label>
            <Input id="paymentTerms" name="paymentTerms" maxLength={60} placeholder="Advance" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="salesPerson">Sales person</Label>
            <Input id="salesPerson" name="salesPerson" maxLength={60} className="mt-1.5" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Remarks</Label>
            <Textarea id="notes" name="notes" maxLength={500} rows={2} className="mt-1.5" />
          </div>
        </CardContent>
      </Card>

      {state?.message ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Grand total</p>
          <p className="text-2xl font-extrabold text-navy">{formatPrice(total, currency)}</p>
        </div>
        <Button type="submit" disabled={pending || items.length === 0} className="px-6 font-semibold">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Generate Invoice
        </Button>
      </div>
    </form>
  );
}
