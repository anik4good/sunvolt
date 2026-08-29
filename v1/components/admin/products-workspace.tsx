"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  MoreVertical,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface WorkspaceProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: string;
  salePrice: string;
  onSale: boolean;
  stock: number;
  active: boolean;
  featured: boolean;
  image: string | null;
}

const PAGE_SIZES = ["10", "20", "30", "40", "50"];
const PRICE_RANGES = [
  { value: "all", label: "All Prices" },
  { value: "0:10000", label: "Under ৳10,000" },
  { value: "10000:50000", label: "৳10,000 – ৳50,000" },
  { value: "50000:100000", label: "৳50,000 – ৳1,00,000" },
  { value: "100000:", label: "Over ৳1,00,000" },
];

type SortField = "name" | "category" | "price" | "stock";
type SortDir = "asc" | "desc";

interface Props {
  rows: WorkspaceProduct[];
  total: number;
  page: number;
  pageSize: number;
  sort: SortField;
  dir: SortDir;
  initialQ: string;
  category: string;
  priceRange: string;
  categories: { slug: string; label: string }[];
  categoryLabels: Record<string, string>;
}

export function ProductsWorkspace({
  rows,
  total,
  page,
  pageSize,
  sort,
  dir,
  initialQ,
  category,
  priceRange,
  categories,
  categoryLabels,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [text, setText] = React.useState(initialQ);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  // Debounced search → q param (resets page).
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if ((searchParams.get("q") ?? "") === text.trim()) return;
      setParams({ q: text.trim() || null });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function setParams(updates: Record<string, string | null>, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (resetPage) params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const allOnPageSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));
  const someOnPageSelected = rows.some((row) => selected.has(row.id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) rows.forEach((row) => next.delete(row.id));
      else rows.forEach((row) => next.add(row.id));
      return next;
    });
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleField(id: string, field: "active" | "featured", value: boolean) {
    const body = new FormData();
    body.set("id", id);
    body.set("field", field);
    body.set("value", String(value));
    await fetch("/admin/products/toggle-active", { method: "POST", body });
    router.refresh();
  }

  async function runBulk(action: "publish" | "unpublish" | "delete") {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (
      action === "delete" &&
      !window.confirm(
        `Delete ${ids.length} product${ids.length === 1 ? "" : "s"}? Products attached to orders cannot be deleted.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      const data = (await res.json()) as {
        updated?: number;
        deleted?: number;
        failed?: { id: string; reason: string }[];
      };
      if (action === "delete") {
        const failed = data.failed?.length ?? 0;
        setNotice(
          failed === 0
            ? `Deleted ${data.deleted ?? 0} product${(data.deleted ?? 0) === 1 ? "" : "s"}.`
            : `Deleted ${data.deleted ?? 0}, failed ${failed} (attached to orders).`,
        );
      } else {
        setNotice(`${data.updated ?? 0} product${(data.updated ?? 0) === 1 ? "" : "s"} updated.`);
      }
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function toggleSort(field: SortField) {
    if (sort === field) {
      setParams({ dir: dir === "asc" ? "desc" : "asc", sort: field }, false);
    } else {
      setParams({ sort: field, dir: "asc" }, false);
    }
  }

  function sortHeader(field: SortField, label: string) {
    const active = sort === field;
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className="inline-flex items-center gap-1 uppercase hover:text-foreground"
        aria-label={`Sort by ${label}`}
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="size-3" aria-hidden />
          ) : (
            <ArrowDown className="size-3" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-40" aria-hidden />
        )}
      </button>
    );
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  function gotoPage(next: number) {
    if (next < 1 || next > pageCount || next === page) return;
    setParams({ page: String(next) }, false);
  }

  const exportHref = `/admin/products/export?${searchParams.toString()}`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={exportHref} download>
            <ArrowDown className="size-3.5" aria-hidden />
            Export
          </a>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={selected.size === 0 || busy}>
              <ArrowUpDown className="size-3.5" aria-hidden />
              Bulk Action ({selected.size})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => runBulk("publish")}>Publish</DropdownMenuItem>
            <DropdownMenuItem onClick={() => runBulk("unpublish")}>Unpublish</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          disabled={selected.size === 0 || busy}
          onClick={() => runBulk("delete")}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Delete
        </Button>
        <Button asChild size="sm" className="ml-auto font-semibold">
          <Link href="/admin/products/new">
            <Plus className="size-3.5" aria-hidden />
            Add Product
          </Link>
        </Button>
      </div>

      {notice ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
          {notice}
        </p>
      ) : null}

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-8 w-full max-w-60 items-center gap-2 rounded-lg border bg-background px-3 text-sm sm:w-60">
          <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          {/* key resets the box when the URL's q changes (e.g. header search) */}
          <input
            key={initialQ}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Search by product name"
            aria-label="Search by product name"
            className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </label>

        <Select value={category} onValueChange={(value) => setParams({ category: value === "all" ? null : value })}>
          <SelectTrigger size="sm" className="w-40 bg-background">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priceRange} onValueChange={(value) => setParams({ price: value === "all" ? null : value })}>
          <SelectTrigger size="sm" className="w-44 bg-background">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-gray-50 text-left text-xs tracking-wide text-muted-foreground uppercase dark:bg-gray-800/60">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                    }}
                    onChange={toggleAll}
                    aria-label="Select all"
                    className="size-3.5 accent-emerald-600"
                  />
                </th>
                <th className="px-3 py-3">{sortHeader("name", "Product Name")}</th>
                <th className="px-3 py-3">{sortHeader("category", "Category")}</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">{sortHeader("price", "Sale Price")}</th>
                <th className="px-3 py-3">{sortHeader("stock", "Stock")}</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-center">View</th>
                <th className="px-3 py-3 text-center">Published</th>
                <th className="px-3 py-3 text-center">Featured</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    <PackageOpen className="mx-auto mb-2 size-8 opacity-50" aria-hidden />
                    No products match.{" "}
                    <Link
                      href="/admin/products"
                      className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      Clear filters
                    </Link>
                  </td>
                </tr>
              ) : (
                rows.map((product) => (
                  <tr key={product.id} className="border-t hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleRow(product.id)}
                        aria-label={`Select ${product.name}`}
                        className="size-3.5 accent-emerald-600"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt=""
                            width={32}
                            height={32}
                            className="size-8 shrink-0 rounded-lg border object-cover"
                          />
                        ) : (
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-secondary text-[10px] text-muted-foreground">
                            —
                          </span>
                        )}
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="max-w-44 truncate font-medium hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
                          title={product.name}
                        >
                          {product.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {categoryLabels[product.category] ?? product.category}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                      {product.onSale ? (
                        <span className="line-through">{formatPrice(product.price)}</span>
                      ) : (
                        formatPrice(product.price)
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium whitespace-nowrap">
                      {formatPrice(product.salePrice)}
                    </td>
                    <td className="px-3 py-3">{product.stock}</td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          product.stock > 0
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
                        )}
                      >
                        {product.stock > 0 ? "Selling" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Link
                        href={`/products/${product.slug}`}
                        target="_blank"
                        aria-label={`View ${product.name} in store`}
                        className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Eye className="size-4" aria-hidden />
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Switch
                        checked={product.active}
                        onCheckedChange={(next) => toggleField(product.id, "active", next)}
                        disabled={busy}
                        checkedClass="bg-sky-500"
                        aria-label={`Published: ${product.name}`}
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Switch
                        checked={product.featured}
                        onCheckedChange={(next) => toggleField(product.id, "featured", next)}
                        disabled={busy}
                        checkedClass="bg-pink-500"
                        aria-label={`Featured: ${product.name}`}
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${product.name}`}
                          >
                            <MoreVertical className="size-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/products/${product.id}`}>
                              <Pencil aria-hidden />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/products/${product.slug}`} target="_blank">
                              <Eye aria-hidden />
                              View in store
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              if (window.confirm(`Delete "${product.name}"? Products attached to orders cannot be deleted.`)) {
                                setSelected(new Set([product.id]));
                                void runBulk("delete");
                              }
                            }}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 aria-hidden />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-3 text-sm">
          <p className="text-muted-foreground">
            {selected.size} of {total} row(s) selected.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => setParams({ pageSize: value === "20" ? null : value })}
              >
                <SelectTrigger size="sm" className="w-16 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-muted-foreground">
              Page {page} of {pageCount}
            </span>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => gotoPage(1)}
                disabled={page <= 1}
                aria-label="First page"
              >
                <ChevronsLeft className="size-4" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => gotoPage(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => gotoPage(page + 1)}
                disabled={page >= pageCount}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => gotoPage(pageCount)}
                disabled={page >= pageCount}
                aria-label="Last page"
              >
                <ChevronsRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
