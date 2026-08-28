"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveCategory,
  type AdminFormState,
} from "@/app/admin/(panel)/categories/actions";
import type { Category } from "@/db/schema";

export function CategoryForm({ category }: { category?: Category }) {
  const [state, formAction, pending] = useActionState<AdminFormState | undefined, FormData>(
    (prev, formData) => saveCategory(category?.id ?? null, prev, formData),
    undefined,
  );

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {state?.message ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Label (English) *</Label>
          <Input name="label" required defaultValue={category?.label} placeholder="Fan" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Bangla label</Label>
          <Input
            name="labelBn"
            defaultValue={category?.labelBn ?? ""}
            placeholder="ফ্যান"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Slug</Label>
          <Input name="slug" defaultValue={category?.slug} placeholder="fan" />
          <p className="mt-1 text-xs text-muted-foreground">
            Leave blank to generate from the label. Lowercase letters, numbers
            and dashes only.
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Icon (emoji)</Label>
          <Input name="icon" maxLength={4} defaultValue={category?.icon ?? "⚡"} placeholder="🌀" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="active" name="active" defaultChecked={category?.active ?? true} />
        <Label htmlFor="active" className="text-sm font-normal">
          Active — visible on the public site and in the product form
        </Label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Save aria-hidden />}
          Save Category
        </Button>
        <Link href="/admin/categories" className="text-sm text-muted-foreground hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
