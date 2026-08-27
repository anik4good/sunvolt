import Link from "next/link";
import { asc, sql } from "drizzle-orm";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { toggleCategoryActive, deleteCategory } from "./actions";

export const metadata = { title: "Categories | SunVolt Admin" };

interface PageProps {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}

export default async function AdminCategoriesPage({
  searchParams,
}: PageProps) {
  const { saved, deleted } = await searchParams;
  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.label)),
    db
      .select({ category: products.category, count: sql<number>`count(*)::int` })
      .from(products)
      .groupBy(products.category),
  ]);
  const productCount = new Map(counts.map((c) => [c.category, c.count]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Product categories shown across the site and in the product form.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/categories/new">
            <Plus aria-hidden />
            New Category
          </Link>
        </Button>
      </div>

      {saved ? (
        <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">
          Category saved.
        </p>
      ) : null}
      {deleted ? (
        <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">
          Category deleted.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((category) => (
              <tr key={category.id} className="border-t hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <span className="mr-2 text-lg" aria-hidden>
                    {category.icon}
                  </span>
                  <span className="font-semibold text-navy">{category.label}</span>
                  {category.labelBn ? (
                    <span className="ml-2 text-muted-foreground">{category.labelBn}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {category.slug}
                </td>
                <td className="px-4 py-3 font-medium">
                  {productCount.get(category.slug) ?? 0}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      category.active
                        ? "border-leaf text-leaf"
                        : "border-muted-foreground text-muted-foreground"
                    }
                  >
                    {category.active ? "active" : "disabled"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <form
                      action={toggleCategoryActive.bind(
                        null,
                        category.id,
                        !category.active,
                      )}
                    >
                      <Button type="submit" variant="outline" size="sm">
                        {category.active ? "Disable" : "Enable"}
                      </Button>
                    </form>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/categories/${category.id}`}>
                        <Pencil aria-hidden />
                        Edit
                      </Link>
                    </Button>
                    <DeleteButton
                      label=""
                      confirmText={`Delete "${category.label}"? Categories in use by products cannot be deleted.`}
                      action={deleteCategory}
                      id={category.id}
                      className="h-8 px-2.5 text-destructive"
                      icon={<Trash2 className="size-4" aria-hidden />}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
