"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProductImagesEditor } from "@/components/admin/product-images-editor";
import { ProductDescriptionEditor } from "@/components/admin/product-description-editor";
import {
  saveProduct,
  type ProductFormState,
} from "@/app/admin/(panel)/products/actions";
import type { Product } from "@/db/schema";
import type { PanelRate } from "@/lib/panel-rates";
import { formatNumber } from "@/lib/format";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function specsToText(specs: Record<string, string> | null): string {
  return Object.entries(specs ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function ProductForm({
  product,
  panelRates,
}: {
  product?: Product;
  panelRates: PanelRate[];
}) {
  // Bound server action — works with JS and without (progressive enhancement)
  const [state, formAction, pending] = useActionState<ProductFormState | undefined, FormData>(
    saveProduct.bind(null, product?.id ?? null),
    undefined,
  );
  const [category, setCategory] = useState(product?.category ?? "package");
  const isPackage = category === "package";
  const isPanel = category === "solar-panel";

  // Panel wattage default: saved value, else parsed from the rated-power spec
  const specsPower = product?.specs?.["Rated Power"] ?? product?.specs?.["Maximum Power (Pmax)"] ?? "";
  const specsWatt = Number.parseInt(String(specsPower).replace(/[^0-9]/g, ""), 10);
  const [price, setPrice] = useState(product ? String(Number(product.price)) : "");
  const [panelVolt, setPanelVolt] = useState(
    product?.panelVoltage ? String(product.panelVoltage) : "",
  );
  const [panelWatt, setPanelWatt] = useState(
    String(product?.solarPanelWatt ?? (specsWatt || "") ?? ""),
  );

  // Live panel price from the global per-watt rate; fills the price field.
  const selectedRate = panelRates.find((r) => String(r.volt) === panelVolt);
  const wattNum = Number(panelWatt);
  const computedPrice =
    selectedRate && wattNum > 0
      ? Math.round(selectedRate.perWatt * wattNum * 100) / 100
      : null;
  useEffect(() => {
    if (computedPrice != null) setPrice(String(computedPrice));
  }, [computedPrice]);

  // Keep the saved voltage selectable even if its rate was removed in Settings
  const voltOptions =
    panelVolt && !panelRates.some((r) => String(r.volt) === panelVolt)
      ? [{ volt: Number(panelVolt), perWatt: null as number | null }, ...panelRates]
      : panelRates;

  return (
    <form action={formAction} className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name (English) *">
          <Input name="name" required defaultValue={product?.name} placeholder="SunVolt 12 Hour" />
        </Field>
        <Field label="Bengali name" hint="Shown to customers when filled">
          <Input name="nameBn" defaultValue={product?.nameBn ?? ""} placeholder="সানভোল্ট ১২ আওয়ার প্যাকেজ" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category *">
          <Select name="category" value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="package">Backup Package (combo)</SelectItem>
              {PRODUCT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Slug" hint="Leave blank to generate from the name">
          <Input name="slug" defaultValue={product?.slug} placeholder="sunvolt-12-hour" />
        </Field>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">
          Images — first one is the cover shown on cards
        </Label>
        <div className="mt-2">
          <ProductImagesEditor
            initial={
              product
                ? [product.imageUrl, ...(product.images ?? [])].filter(
                    (v): v is string => Boolean(v),
                  )
                : []
            }
          />
        </div>
      </div>

      <Field
        label="Description (shown in the Description tab)"
        hint="Optional — paste formatted text and images from another website. Leave empty to hide the tab."
      >
        <ProductDescriptionEditor initialValue={product?.description} />
      </Field>

      {isPackage ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Battery voltage (V) *">
              <Input name="batteryVoltage" type="number" min={1} step="0.1" defaultValue={product?.batteryVoltage ?? 12.6} />
            </Field>
            <Field label="Battery capacity (Ah) *">
              <Input name="batteryCapacityAh" type="number" min={1} defaultValue={product?.batteryCapacityAh ?? ""} />
            </Field>
            <Field label="Battery type *">
              <Input name="batteryType" defaultValue={product?.batteryType ?? "LiFePO4"} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Solar panel (W)">
              <Input name="solarPanelWatt" type="number" min={0} defaultValue={product?.solarPanelWatt ?? ""} />
            </Field>
            <Field label="Controller (W)">
              <Input name="controllerWatt" type="number" min={0} defaultValue={product?.controllerWatt ?? ""} />
            </Field>
            <Field label="Backup hours *">
              <Input name="backupHours" type="number" min={1} defaultValue={product?.backupHours ?? ""} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Recommended load (W) *">
              <Input name="recommendedLoadWatt" type="number" min={1} defaultValue={product?.recommendedLoadWatt ?? ""} />
            </Field>
            <Field label="Installation price (৳)" hint="Leave blank for “separate charge”">
              <Input name="installationPrice" type="number" min={0} step="0.01" defaultValue={product?.installationPrice ? Number(product.installationPrice) : ""} />
            </Field>
            <div className="hidden sm:block" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Example: fan count" hint="Shown as “চালাতে পারবেন” on the card">
              <Input name="exampleFanCount" type="number" min={0} max={20} defaultValue={product?.exampleFanCount ?? ""} />
            </Field>
            <Field label="Example: light count">
              <Input name="exampleLightCount" type="number" min={0} max={30} defaultValue={product?.exampleLightCount ?? ""} />
            </Field>
            <div className="hidden sm:block" />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand">
              <Input name="brand" defaultValue={product?.brand ?? ""} placeholder="ELEJOY" />
            </Field>
            <Field label="Model">
              <Input name="model" defaultValue={product?.model ?? ""} placeholder="WS-M300-14.6V" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Specs" hint="One per line — “Label: Value”">
              <Textarea
                name="specsText"
                rows={7}
                defaultValue={specsToText(product?.specs ?? null)}
                placeholder={"Maximum Output Power: 65W\nInput (PV) Voltage Range: 15V – 60V"}
              />
            </Field>
            <Field label="Features" hint="One per line — top 8 shown on the product page">
              <Textarea
                name="featuresText"
                rows={5}
                defaultValue={(product?.features ?? []).join("\n")}
                placeholder={"65W Maximum Output\nMPPT Solar Charging"}
              />
            </Field>
            <Field label="Packaging" hint="One per line — “Label: Value”">
              <Textarea
                name="packagingText"
                rows={5}
                defaultValue={specsToText(product?.packaging ?? null)}
                placeholder={"Selling Units: Single item\nSingle package size: 17.2X13.8X4.7 cm\nSingle gross weight: 1.35 kg"}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Supplier cost per piece (৳)"
              hint="Your buying price for one unit — powers the margin column. Leave blank to keep the saved value."
            >
              <Input
                name="costPerPiece"
                type="number"
                min={0}
                step="0.01"
                placeholder="1050"
                defaultValue={
                  product?.costPrice && "perPiece" in product.costPrice
                    ? product.costPrice.perPiece
                    : ""
                }
              />
            </Field>
            <div className="space-y-2">
              <Field label="Source URL" hint="Supplier listing this data came from">
                <Input name="sourceUrl" defaultValue={product?.sourceUrl ?? ""} placeholder="https://www.alibaba.com/product-detail/..." />
              </Field>
              {product?.sourceUrl ? (
                <a
                  href={product.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-medium text-navy underline"
                >
                  Open source listing ↗
                </a>
              ) : null}
            </div>
          </div>
        </>
      )}

      {isPanel ? (
        <div className="grid gap-4 rounded-xl border border-solar/40 bg-solar-light/30 p-4 sm:grid-cols-3">
          <Field
            label="Panel system voltage"
            hint={
              panelRates.length > 0
                ? "Picks the global ৳/W rate from Settings"
                : "Set per-watt rates in Settings → Solar panel pricing first"
            }
          >
            <Select name="panelVoltage" value={panelVolt} onValueChange={setPanelVolt}>
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {voltOptions.map((r) => (
                  <SelectItem key={r.volt} value={String(r.volt)}>
                    {r.volt}V{r.perWatt != null ? ` — ৳${r.perWatt}/W` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Panel wattage (W)">
            <Input
              name="solarPanelWatt"
              type="number"
              min={1}
              placeholder="150"
              value={panelWatt}
              onChange={(e) => setPanelWatt(e.target.value)}
            />
          </Field>
          <Field label="Calculated price" hint="Rate × watts — fills Price below">
            <div className="flex h-9 items-center rounded-md border bg-card px-3 text-sm font-semibold text-navy">
              {computedPrice != null
                ? `৳${formatNumber(computedPrice)} (${selectedRate?.perWatt} × ${wattNum}W)`
                : "—"}
            </div>
          </Field>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Price (৳) *"
          hint={isPanel ? "Auto-filled from rate × watts — still editable" : "Selling price after discount"}
        >
          <Input
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        <Field label="Discount %" hint="0–90, shows a −% badge">
          <Input name="discountPct" type="number" min={0} max={90} defaultValue={product?.discountPct ?? 0} />
        </Field>
        <Field label="Warranty (months) *">
          <Input name="warrantyMonths" type="number" min={0} required defaultValue={product?.warrantyMonths ?? 6} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Stock">
          <Input name="stock" type="number" min={0} required defaultValue={product?.stock ?? 0} />
        </Field>
        <div className="hidden sm:block" />
        <div className="hidden sm:block" />
      </div>

      <div className="flex flex-wrap gap-6 rounded-xl border p-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <Checkbox name="active" defaultChecked={product?.active ?? true} className="size-5" />
          Active (visible on website)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <Checkbox name="featured" defaultChecked={product?.featured ?? false} className="size-5" />
          Featured (highlighted on homepage)
        </label>
      </div>

      {state?.message ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="font-semibold">
          {pending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            <>
              <Save aria-hidden />
              {product ? "Save changes" : "Create product"}
            </>
          )}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
