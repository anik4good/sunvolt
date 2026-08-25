import Link from "next/link";
import { asc } from "drizzle-orm";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import {
  deleteProduct,
  toggleProductActive,
  toggleProductFeatured,
} from "./actions";
import { DeleteButton } from "@/components/admin/delete-button";

export const metadata = { title: "Products | SunVolt Admin" };

interface PageProps {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { saved, deleted } = await searchParams;
  const rows = await db.select().from(products).orderBy(asc(products.batteryCapacityAh));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Products</h1>
        <Button asChild size="sm">
          <Link href="/admin/products/new">
            <Plus aria-hidden />
            New Product
          </Link>
        </Button>
      </div>

      {saved ? (
        <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">Package saved.</p>
      ) : null}
      {deleted ? (
        <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">Package deleted.</p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Battery</th>
              <th className="px-4 py-3">Backup</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => (
              <tr key={product.id} className="border-t align-middle hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy">{product.name}</span>
                    {product.featured ? (
                      <form action={toggleProductFeatured.bind(null, product.id, false)}>
                        <button
                          type="submit"
                          className="text-solar-dark hover:opacity-70"
                          title="Unset featured"
                          aria-label="Unset featured"
                        >
                          <Star className="size-4 fill-current" aria-hidden />
                        </button>
                      </form>
                    ) : (
                      <form action={toggleProductFeatured.bind(null, product.id, true)}>
                        <button
                          type="submit"
                          className="text-muted-foreground/40 hover:text-solar-dark"
                          title="Set featured"
                          aria-label="Set featured"
                        >
                          <Star className="size-4" aria-hidden />
                        </button>
                      </form>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">/{product.slug}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {product.category === "package" && product.batteryCapacityAh
                    ? `${product.batteryVoltage}V ${product.batteryCapacityAh}Ah ${product.batteryType}`
                    : `${product.brand ?? ""} ${product.model ?? ""}`.trim() || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {product.category === "package" && product.backupHours
                    ? `${product.backupHours}h`
                    : "—"}
                </td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap">
                  {formatPrice(product.price)}
                </td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={product.active ? "border-leaf text-leaf" : "border-muted-foreground text-muted-foreground"}
                  >
                    {product.active ? "active" : "disabled"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <form action={toggleProductActive.bind(null, product.id, !product.active)}>
                      <Button type="submit" variant="outline" size="sm">
                        {product.active ? "Disable" : "Enable"}
                      </Button>
                    </form>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/products/${product.id}`}>
                        <Pencil aria-hidden />
                        Edit
                      </Link>
                    </Button>
                    <DeleteButton
                      label="Delete"
                      confirmText={`Delete "${product.name}"? This cannot be undone.`}
                      action={deleteProduct}
                      id={product.id}
                      className="h-8 px-3 text-destructive"
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
