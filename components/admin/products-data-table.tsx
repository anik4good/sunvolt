"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Eye, EyeOff, Pencil, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { useRouter } from "next/navigation";
import type { Product } from "@/db/schema";

interface ProductsDataTableProps {
  data: Product[];
  showMargin: boolean;
  usdRate: number;
  categoryLabels: Record<string, string>;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge variant="outline" className="border-destructive text-destructive text-[10px] px-2 py-0.5">Out of stock</Badge>;
  }
  if (stock < 5) {
    return <Badge variant="outline" className="border-solar text-solar-dark text-[10px] px-2 py-0.5">Low · {stock}</Badge>;
  }
  return <Badge variant="outline" className="border-leaf text-leaf text-[10px] px-2 py-0.5">In stock · {stock}</Badge>;
}

export function ProductsDataTable({ data, showMargin, usdRate, categoryLabels }: ProductsDataTableProps) {
  const router = useRouter();
  const [optimisticUpdates, setOptimisticUpdates] = React.useState<Record<string, boolean>>({});

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    // Optimistic update
    setOptimisticUpdates(prev => ({ ...prev, [productId]: !currentActive }));

    // Drop the override once the request settles so the button re-enables;
    // on success router.refresh() brings the new server value, on failure
    // this reverts the row to the saved state.
    const clearOptimistic = () =>
      setOptimisticUpdates(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });

    try {
      const response = await fetch('/admin/products/toggle-active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          id: productId,
          active: (!currentActive).toString(),
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch {
      // network failure — clearing below reverts the optimistic flip
    } finally {
      clearOptimistic();
    }
  };

  // Apply optimistic updates to data. Memoized: a fresh array identity on
  // every render feeds useReactTable a new `data` ref, which re-derives all
  // row models and (under React 19's scheduler) can cascade into an endless
  // re-render loop that pins the tab.
  const enrichedData = React.useMemo(
    () =>
      data.map(product => ({
        ...product,
        active:
          optimisticUpdates[product.id] !== undefined
            ? optimisticUpdates[product.id]
            : product.active,
      })),
    [data, optimisticUpdates],
  );

  // Default columns to show (based on user request)
  const defaultColumnVisibility = (showMargin: boolean): VisibilityState => ({
    product: true,
    category: false, // Hidden by default
    brand: false, // Hidden by default
    model: false, // Hidden by default
    price: true,
    cost_margin: showMargin,
    warrantyMonths: true, // Warranty column
    installationPrice: false, // Hidden by default
    stock: true,
    active: true, // Status column
    sourceUrl: false, // Hidden by default
    specs: false, // Hidden by default
    createdAt: true, // Created column
    updatedAt: true, // Updated column
    actions: true,
  });

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  // Initial state must match what the server rendered. Reading localStorage
  // during render (the old approach) produced different columns on the
  // client, broke hydration, and could leave the table stuck re-rendering.
  // Saved preferences are merged in after hydration instead.
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    () => defaultColumnVisibility(showMargin),
  );

  // Merge saved column visibility after mount, then re-apply the server
  // setting: disabling margin must hide it even when an older browser
  // preference had previously enabled the column.
  React.useEffect(() => {
    let saved: VisibilityState | null = null;
    try {
      const raw = localStorage.getItem("admin-products-column-visibility");
      if (raw) saved = JSON.parse(raw) as VisibilityState;
    } catch (e) {
      console.error("Failed to parse saved column visibility", e);
    }
    if (saved || !showMargin) {
      setColumnVisibility(() => ({
        ...defaultColumnVisibility(showMargin),
        ...(saved ?? {}),
        cost_margin: showMargin ? (saved?.cost_margin ?? true) : false,
      }));
    }
  }, [showMargin]);

  // Save column visibility to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin-products-column-visibility", JSON.stringify(columnVisibility));
    }
  }, [columnVisibility]);

  // Memoized for TanStack: a new columns identity on every render would make
  // the table re-derive its models each pass and can loop renders endlessly.
  const columns: ColumnDef<Product>[] = React.useMemo(() => [
    // Product column with image and name
    {
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Link
              prefetch={false}
              href={`/admin/products/${product.id}`}
              className="size-7 shrink-0 overflow-hidden rounded border bg-white"
            >
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs" aria-hidden>
                  ⚡
                </span>
              )}
            </Link>
            <div className="min-w-0 max-w-[180px]">
              <div className="flex items-center gap-1">
                <Link
                  prefetch={false}
                  href={`/admin/products/${product.id}`}
                  className="truncate font-semibold text-navy hover:underline text-xs"
                >
                  {product.name}
                </Link>
                {product.featured && (
                  <Star className="size-3 fill-solar-dark text-solar-dark shrink-0" aria-hidden />
                )}
              </div>
              <span className="block truncate text-[10px] text-muted-foreground">
                /{product.slug}
                {product.brand ? ` · ${product.brand}` : ""}
              </span>
            </div>
          </div>
        );
      },
    },
    
    // Category column
    {
      accessorKey: "category",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 text-xs"
          >
            Category
            <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const product = row.original;
        return (
          <Badge
            variant="outline"
            className={product.category === "package" ? "border-solar text-solar-dark text-[10px] px-2 py-0.5" : "border-navy/30 text-navy text-[10px] px-2 py-0.5"}
          >
            {product.category === "package" ? "Package" : (categoryLabels[product.category] ?? product.category)}
          </Badge>
        );
      },
    },
    
    // Brand column (hidden by default)
    {
      accessorKey: "brand",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 text-xs"
          >
            Brand
            <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
          </Button>
        );
      },
      cell: ({ row }) => row.original.brand || <span className="text-muted-foreground/50">—</span>,
    },
    
    // Model column (hidden by default)
    {
      accessorKey: "model",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 text-xs"
          >
            Model
            <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
          </Button>
        );
      },
      cell: ({ row }) => row.original.model || <span className="text-muted-foreground/50">—</span>,
    },
    
    // Price column
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 text-xs"
          >
            Price
            <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="whitespace-nowrap text-xs">
            <span className="font-semibold text-navy">{formatPrice(product.price)}</span>
            {product.discountPct > 0 && (
              <span className="ml-1 rounded-full bg-destructive/10 px-1 py-0.5 text-[9px] font-bold text-destructive">
                −{product.discountPct}%
              </span>
            )}
          </div>
        );
      },
    },
    
    // Cost & Margin column (conditional)
    {
      accessorKey: "cost_margin",
      header: "Cost / Margin",
      cell: ({ row }) => {
        const product = row.original;

        // Simple per-piece cost (entered directly in ৳)
        if (product.costPrice && "perPiece" in product.costPrice) {
          const costBdt = Math.round(product.costPrice.perPiece);
          const margin = Math.round(Number(product.price) - costBdt);
          return (
            <div className="whitespace-nowrap text-xs">
              <span className="text-muted-foreground">৳{formatNumber(costBdt)}</span>{" "}
              <span className="font-semibold text-leaf">+{formatPrice(margin)}</span>
            </div>
          );
        }

        // Legacy imported Alibaba USD ladder
        if (!product.costPrice?.ladder?.[0]) {
          return <span className="text-muted-foreground/50">—</span>;
        }

        const firstTier = product.costPrice.ladder[0];
        const costBdt = Math.round(firstTier.priceUsd * usdRate);
        const margin = Math.round(Number(product.price) - costBdt);

        return (
          <div className="whitespace-nowrap text-xs" title={`MOQ ${product.costPrice.moq} pcs · ${product.costPrice.ladder.map((l) => `${l.qtyMin}${l.qtyMax ? `-${l.qtyMax}` : "+"}=$${l.priceUsd}`).join(" · ")}`}>
            <span className="text-muted-foreground">
              ${firstTier.priceUsd} (৳{formatNumber(costBdt)})
            </span>{" "}
            <span className="font-semibold text-leaf">
              +{formatPrice(margin)}
            </span>
          </div>
        );
      },
    },
    
    // Warranty column (hidden by default)
    {
      accessorKey: "warrantyMonths",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 text-xs"
          >
            Warranty
            <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const warranty = row.original.warrantyMonths;
        return warranty ? (
          <Badge variant="outline" className="border-navy/30 text-navy text-[10px] px-2 py-0.5">
            {warranty} {warranty === 1 ? "month" : "months"}
          </Badge>
        ) : (
          <span className="text-muted-foreground/50 text-xs">—</span>
        );
      },
    },
    
    // Installation price column (hidden by default)
    {
      accessorKey: "installationPrice",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 text-xs"
          >
            Installation
            <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const installationPrice = row.original.installationPrice;
        return installationPrice ? (
          <span className="font-medium text-xs">{formatPrice(installationPrice)}</span>
        ) : (
          <span className="text-muted-foreground/50 text-xs">—</span>
        );
      },
    },
    
    // Stock column
    {
      accessorKey: "stock",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 text-xs"
          >
            Stock
            <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
          </Button>
        );
      },
      cell: ({ row }) => <StockBadge stock={row.original.stock} />,
    },
    
    // Status column
    {
      accessorKey: "active",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 text-xs"
          >
            Status
            <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const product = row.original;
        return (
          <Badge
            variant="outline"
            className={product.active ? "border-leaf text-leaf text-[10px] px-2 py-0.5" : "border-muted-foreground text-muted-foreground text-[10px] px-2 py-0.5"}
          >
            {product.active ? "active" : "disabled"}
          </Badge>
        );
      },
    },
    
    // Source URL column (hidden by default)
    {
      accessorKey: "sourceUrl",
      header: "Source",
      cell: ({ row }) => {
        const sourceUrl = row.original.sourceUrl;
        return sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-600 hover:underline"
          >
            View source →
          </a>
        ) : (
          <span className="text-muted-foreground/50 text-[10px]">—</span>
        );
      },
    },
    
    // Specs column (hidden by default)
    {
      accessorKey: "specs",
      header: "Specs",
      cell: ({ row }) => {
        const specs = row.original.specs;
        if (!specs || Object.keys(specs).length === 0) {
          return <span className="text-muted-foreground/50 text-[10px]">—</span>;
        }
        const specKeys = Object.keys(specs).slice(0, 3);
        return (
          <div className="max-w-xs truncate text-[10px]">
            {specKeys.map((key) => (
              <div key={key} className="truncate">
                <span className="font-medium">{key}:</span> {specs[key]}
              </div>
            ))}
            {Object.keys(specs).length > 3 && <div className="text-muted-foreground">+{Object.keys(specs).length - 3} more</div>}
          </div>
        );
      },
    },
    
    // Created date column (hidden by default)
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 text-xs"
          >
            Created
            <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="whitespace-nowrap text-muted-foreground text-[10px]">
            {formatDate(row.original.createdAt)}
          </div>
        );
      },
    },

    // Updated date column
    {
      accessorKey: "updatedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-7 px-2 text-xs"
          >
            Updated
            <ArrowUpDown className="ml-1 h-2.5 w-2.5" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="whitespace-nowrap text-muted-foreground text-[10px]">
            {formatDate(row.original.updatedAt)}
          </div>
        );
      },
    },
    
    // Actions column
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleActive(product.id, product.active)}
              disabled={optimisticUpdates[product.id] !== undefined}
              aria-label={product.active ? `Disable ${product.name}` : `Enable ${product.name}`}
              title={product.active ? "Hide from website" : "Show on website"}
              className="h-7 px-2 text-xs"
            >
              {product.active ? <EyeOff className="size-3" aria-hidden /> : <Eye className="size-3" aria-hidden />}
              {product.active ? "Disable" : "Enable"}
            </Button>
            <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
              <Link prefetch={false} href={`/admin/products/${product.id}`}>
                <Pencil className="size-3" aria-hidden />
                Edit
              </Link>
            </Button>
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [showMargin, usdRate, optimisticUpdates, router]);

  const table = useReactTable({
    data: enrichedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="space-y-4">
      {/* Column visibility controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto h-8 px-3 text-xs">
                <ColumnsIcon className="mr-2 h-3.5 w-3.5" />
                Columns <ChevronDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
                {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const columnNames: Record<string, string> = {
                    product: "Product",
                    category: "Category", 
                    brand: "Brand",
                    model: "Model",
                    price: "Price",
                    cost_margin: "Cost / Margin",
                    warrantyMonths: "Warranty",
                    installationPrice: "Installation",
                    stock: "Stock",
                    active: "Status",
                    sourceUrl: "Source",
                    specs: "Specs",
                    createdAt: "Created",
                    updatedAt: "Updated",
                    actions: "Actions",
                  };
                  
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {columnNames[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} {table.getFilteredRowModel().rows.length === 1 ? "product" : "products"}
        </div>
      </div>

      {/* Data table */}
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-xs">
            <thead className="bg-secondary/60 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-3 py-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t align-middle hover:bg-secondary/30">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Columns icon component
function ColumnsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}