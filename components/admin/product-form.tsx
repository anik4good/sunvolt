"use client";

import { useActionState, useState } from "react";
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
import {
  saveProduct,
  type ProductFormState,
} from "@/app/admin/(panel)/products/actions";
import type { Product } from "@/db/schema";

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

export function ProductForm({ product }: { product?: Product }) {
  const [state, formAction, pending] = useActionState<ProductFormState | undefined, FormData>(
    (prev, formData) => saveProduct(product?.id ?? null, prev, formData),
    undefined,
  );
  const [category, setCategory] = useState(product?.category ?? "package");
  const isPackage = category === "package";

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
              <SelectItem value="solar-inverter">Solar Inverter</SelectItem>
              <SelectItem value="bms">BMS</SelectItem>
              <SelectItem value="solar-panel">Solar Panel</SelectItem>
              <SelectItem value="inverter">Inverter</SelectItem>
              <SelectItem value="diy-solar">DIY Solar</SelectItem>
              <SelectItem value="mppt-charger">MPPT Charger</SelectItem>
              <SelectItem value="dc-charger">DC Charger</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
              <SelectItem value="battery">Battery</SelectItem>
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

      <Field label="Description (Bengali, shown to customers)">
        <Textarea name="description" rows={3} defaultValue={product?.description ?? ""} />
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
            <Field label="Features" hint="One per line">
              <Textarea
                name="featuresText"
                rows={7}
                defaultValue={(product?.features ?? []).join("\n")}
                placeholder={"65W Maximum Output\nMPPT Solar Charging"}
              />
            </Field>
          </div>
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (৳) *" hint="Selling price after discount">
          <Input name="price" type="number" min={0} step="0.01" required defaultValue={product ? Number(product.price) : ""} />
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
