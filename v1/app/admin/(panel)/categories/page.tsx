import Link from "next/link";
import { asc, sql } from "drizzle-orm";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/admin/delete-button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ActiveStatusBadge } from "@/components/admin/status-badge";
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
      <AdminPageHeader
        title="Categories"
        description="Product categories shown across the site and in the product form."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/categories/new">
              <Plus aria-hidden />
              New Category
            </Link>
          </Button>
        }
      />

      {saved ? (
        <p className="rounded-xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">
          Category saved.
        </p>
      ) : null}
      {deleted ? (
        <p className="rounded-xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">
          Category deleted.
        </p>
      ) : null}

      <Card className="gap-0 py-0">
        <div className="overflow-x-auto">
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
                  <span className="font-semibold">{category.label}</span>
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
                  <ActiveStatusBadge active={category.active} />
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
      </Card>
    </div>
  );
}
