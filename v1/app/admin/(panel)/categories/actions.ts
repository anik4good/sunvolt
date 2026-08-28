"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export interface AdminFormState {
  message: string;
}

const RESERVED_SLUGS = ["package"];

const categorySchema = z.object({
  label: z.string().trim().min(2, "Label is required (min 2 chars)").max(40),
  labelBn: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : null)),
  icon: z.string().trim().min(1).max(4).default("⚡"),
  slug: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v ? v : "")),
  active: z.coerce.boolean(),
});

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function saveCategory(
  id: string | null,
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = categorySchema.safeParse({
    label: formData.get("label"),
    labelBn: formData.get("labelBn") ?? undefined,
    icon: formData.get("icon") || undefined,
    slug: formData.get("slug") ?? undefined,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const slug = slugify(parsed.data.slug || parsed.data.label);
  if (!slug) return { message: "Could not build a slug — provide one." };
  if (RESERVED_SLUGS.includes(slug)) {
    return { message: `"package" is reserved for combo backup packages.` };
  }

  const clash = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      id
        ? and(eq(categories.slug, slug), ne(categories.id, id))
        : eq(categories.slug, slug),
    )
    .limit(1);
  if (clash.length > 0) {
    return { message: `Slug "${slug}" is already used by another category.` };
  }

  if (id) {
    await db
      .update(categories)
      .set({
        slug,
        label: parsed.data.label,
        labelBn: parsed.data.labelBn,
        icon: parsed.data.icon,
        active: parsed.data.active,
      })
      .where(eq(categories.id, id));
  } else {
    const [{ maxOrder }] = await db
      .select({ maxOrder: sql<number>`coalesce(max(${categories.sortOrder}), 0)::int` })
      .from(categories);
    await db.insert(categories).values({
      slug,
      label: parsed.data.label,
      labelBn: parsed.data.labelBn,
      icon: parsed.data.icon,
      active: parsed.data.active,
      sortOrder: maxOrder + 1,
    });
  }

  revalidatePath("/", "layout");
  redirect("/admin/categories?saved=1");
}

export async function toggleCategoryActive(
  id: string,
  active: boolean,
): Promise<void> {
  await requireAdmin();
  await db.update(categories).set({ active }).where(eq(categories.id, id));
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function deleteCategory(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { message: "Missing category id." };

  const rows = await db
    .select({ slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (rows.length === 0) return { message: "Category not found." };

  const inUse = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.category, rows[0].slug))
    .limit(1);
  if (inUse.length > 0) {
    return {
      message:
        "Products still use this category. Move them first, or disable the category instead.",
    };
  }

  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/", "layout");
  redirect("/admin/categories?deleted=1");
}
