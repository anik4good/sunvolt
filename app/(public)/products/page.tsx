import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/products/product-card";
import { SortSelect } from "@/components/products/sort-select";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { getCategoryCounts, getProducts, getSettings, type ProductSort } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Solar Products",
  description:
    "Browse the full SunVolt range — MPPT chargers, solar panels, inverters, BMS, batteries and accessories.",
};

interface PageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
  }>;
}

function buildHref(params: { category?: string; q?: string; sort?: string }) {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  const qs = search.toString();
  return `/products${qs ? `?${qs}` : ""}`;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { category, q, sort } = await searchParams;
  const validCategory = PRODUCT_CATEGORIES.some((c) => c.slug === category)
    ? category
    : undefined;
  const validSort: ProductSort =
    sort === "price-asc" || sort === "price-desc" ? sort : "newest";

  const [settings, items, counts] = await Promise.all([
    getSettings(),
    getProducts({ category: validCategory, q, sort: validSort }),
    getCategoryCounts(),
  ]);

  const totalCount = [...counts.values()].reduce((a, b) => a + b, 0);
  const currentLabel = validCategory
    ? PRODUCT_CATEGORIES.find((c) => c.slug === validCategory)!.label
    : "All categories";

  const categoryNav = (
    <ul className="space-y-1" aria-label="Product categories">
      <li>
        <Link
          href={buildHref({ q, sort: validSort })}
          aria-current={!validCategory ? "true" : undefined}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
            !validCategory ? "bg-navy text-white" : "text-navy/80 hover:bg-secondary"
          }`}
        >
          All categories
          <span className="text-xs opacity-70">{totalCount}</span>
        </Link>
      </li>
      {PRODUCT_CATEGORIES.map((c) => {
        const count = counts.get(c.slug) ?? 0;
        if (count === 0) return null;
        return (
          <li key={c.slug}>
            <Link
              href={buildHref({ category: c.slug, q, sort: validSort })}
              aria-current={validCategory === c.slug ? "true" : undefined}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                validCategory === c.slug
                  ? "bg-navy text-white"
                  : "text-navy/80 hover:bg-secondary"
              }`}
            >
              {c.label}
              <span className="text-xs opacity-70">{count}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-solar-dark">
          Products
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-navy">Solar Products</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our full range of certified equipment.
        </p>
      </header>

      <div className="mt-8 lg:flex lg:gap-8">
        {/* Sidebar */}
        <aside className="lg:w-56 lg:shrink-0">
          <form action="/products" method="get" className="mb-4 hidden lg:block">
            {validCategory ? (
              <input type="hidden" name="category" value={validCategory} />
            ) : null}
            <Input
              type="search"
              name="q"
              placeholder="Search products…"
              defaultValue={q ?? ""}
              aria-label="Search products"
            />
          </form>
          <h2 className="hidden text-sm font-bold uppercase tracking-wide text-muted-foreground lg:block">
            Categories
          </h2>

          {/* Desktop category list */}
          <div className="mt-2 hidden lg:block">{categoryNav}</div>

          {/* Mobile horizontal chips */}
          <div className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden">
            <Link
              href={buildHref({ q, sort: validSort })}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                !validCategory
                  ? "border-navy bg-navy text-white"
                  : "bg-background text-navy/70"
              }`}
            >
              All
            </Link>
            {PRODUCT_CATEGORIES.map((c) => {
              const count = counts.get(c.slug) ?? 0;
              if (count === 0) return null;
              return (
                <Link
                  key={c.slug}
                  href={buildHref({ category: c.slug, q, sort: validSort })}
                  className={`ml-2 inline-block shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                    validCategory === c.slug
                      ? "border-navy bg-navy text-white"
                      : "bg-background text-navy/70"
                  }`}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <div className="mt-6 min-w-0 flex-1 lg:mt-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {items.length} item{items.length === 1 ? "" : "s"}
              {validCategory ? ` · ${currentLabel}` : ""}
              {q ? ` · “${q}”` : ""}
            </p>
            <SortSelect current={validSort} />
          </div>

          {items.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={settings.currency}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-12 text-center">
              <PackageSearch className="mx-auto size-10 text-muted-foreground" aria-hidden />
              <p className="mt-3 font-semibold text-navy">No products found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different category or search term.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-block text-sm font-semibold text-navy hover:underline"
              >
                Browse all products →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
