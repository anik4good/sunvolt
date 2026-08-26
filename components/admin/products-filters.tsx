"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

/**
 * URL-driven filters for the admin products table: debounced text
 * search (name, Bengali name, brand, model, slug), category chips and
 * a status select. The page re-queries from the updated searchParams.
 */
export function ProductsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  // Initialised from the URL; the parent remounts this component with
  // a fresh key when q changes, so no state syncing effect is needed.
  const [text, setText] = useState(q);

  useEffect(() => {
    if (text === q) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (text) params.set("q", text);
      else params.delete("q");
      router.replace(`${pathname}?${params}`, { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [text, q, pathname, router, searchParams]);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  const activeCategory = searchParams.get("category");
  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-navy bg-navy text-white"
        : "bg-background text-navy/70 hover:border-navy/50 hover:text-navy"
    }`;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search name, brand, model…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <Select
          value={searchParams.get("status") ?? "all"}
          onValueChange={(v) => setParam("status", v)}
        >
          <SelectTrigger className="w-full sm:w-36" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by category"
      >
        <button
          type="button"
          onClick={() => setParam("category", "all")}
          className={chipClass(!activeCategory)}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setParam("category", "package")}
          className={chipClass(activeCategory === "package")}
        >
          Packages
        </button>
        {PRODUCT_CATEGORIES.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setParam("category", c.slug)}
            className={chipClass(activeCategory === c.slug)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
