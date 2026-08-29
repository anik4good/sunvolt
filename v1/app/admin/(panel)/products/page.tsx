import { and, asc, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getCategories } from "@/lib/queries";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  ProductsWorkspace,
  type WorkspaceProduct,
} from "@/components/admin/products-workspace";

export const metadata = { title: "Products | SunVolt Admin" };

const PAGE_SIZES = [10, 20, 30, 40, 50];
const SORT_COLUMNS = {
  name: products.name,
  category: products.category,
  price: products.price,
  stock: products.stock,
} as const;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    price?: string;
    sort?: string;
    dir?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categories = await getCategories();
  const activeCategories = categories.filter((c) => c.active);
  const categoryLabels: Record<string, string> = {
    package: "Package",
    ...Object.fromEntries(categories.map((c) => [c.slug, c.label])),
  };

  // ── Filters ──────────────────────────────────────────────────────
  const q = params.q?.trim() || "";
  const category = activeCategories.some((c) => c.slug === params.category)
    ? (params.category as string)
    : null;
  const [minPriceRaw, maxPriceRaw] = (params.price ?? "").split(":");
  const minPrice = minPriceRaw && !Number.isNaN(Number(minPriceRaw)) ? minPriceRaw : null;
  const maxPrice = maxPriceRaw && !Number.isNaN(Number(maxPriceRaw)) ? maxPriceRaw : null;

  const conditions: SQL[] = [];
  if (q) {
    const like = `%${q.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${products.name}) like ${like} or lower(coalesce(${products.nameBn}, '')) like ${like} or lower(coalesce(${products.brand}, '')) like ${like} or lower(coalesce(${products.model}, '')) like ${like} or lower(${products.slug}) like ${like})`,
    );
  }
  if (category) conditions.push(eq(products.category, category));
  if (minPrice) conditions.push(gte(products.price, minPrice));
  if (maxPrice) conditions.push(lte(products.price, maxPrice));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // ── Sort + paginate ──────────────────────────────────────────────
  const sort = (params.sort && params.sort in SORT_COLUMNS
    ? params.sort
    : "name") as keyof typeof SORT_COLUMNS;
  const sortColumn = SORT_COLUMNS[sort];
  const dir = params.dir === "desc" ? "desc" : "asc";
  const pageSize = PAGE_SIZES.includes(Number(params.pageSize))
    ? Number(params.pageSize)
    : 20;
  const countRows = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(products)
    .where(where);
  const total = countRows[0]?.value ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pageCount);

  const rows = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(dir === "desc" ? desc(sortColumn) : asc(sortColumn))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const workspaceRows: WorkspaceProduct[] = rows.map((product) => {
    const discount = product.discountPct > 0 ? product.discountPct : 0;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      // Selling price vs pre-discount original (crossed out when on sale)
      price: String(Math.round(Number(product.price) / (1 - discount / 100))),
      salePrice: product.price,
      onSale: discount > 0,
      stock: product.stock,
      active: product.active,
      featured: product.featured,
      image: product.imageUrl ?? null,
    };
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Products" description="Manage your products inventory" />
      <ProductsWorkspace
        rows={workspaceRows}
        total={total}
        page={page}
        pageSize={pageSize}
        sort={sort as "name" | "category" | "price" | "stock"}
        dir={dir}
        initialQ={q}
        category={category ?? "all"}
        priceRange={params.price || "all"}
        categories={activeCategories.map((c) => ({ slug: c.slug, label: c.label }))}
        categoryLabels={categoryLabels}
      />
    </div>
  );
}
