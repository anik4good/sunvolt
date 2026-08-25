import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Truck, Wallet, ShieldCheck } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { ProductCard } from "@/components/products/product-card";
import { ProductGallery } from "@/components/products/product-gallery";
import { categoryLabel } from "@/lib/categories";
import { getProductBySlug, getRelatedProducts, getSettings } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";
import { fmt, getDict } from "@/lib/i18n";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} | ${product.brand ?? "SunVolt"}`,
    description: product.description ?? undefined,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active || product.category === "package") notFound();

  const [{ d }, settings, related] = await Promise.all([
    getDict(),
    getSettings(),
    getRelatedProducts(slug, product.category),
  ]);

  const original =
    product.discountPct > 0
      ? Math.round(Number(product.price) / (1 - product.discountPct / 100))
      : null;
  const specs = Object.entries(product.specs ?? {});
  const packagingEntries = Object.entries(product.packaging ?? {});

  // Compact spec tiles shown after the price (4 per row). Values come
  // from the model + attribute table with fuzzy key matching.
  const specLookup = (keys: string[]): string | null => {
    const normalized = new Map(
      Object.entries(product.specs ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
    );
    for (const key of keys) {
      const value = normalized.get(key.toLowerCase());
      if (value) return value;
    }
    return null;
  };
  // Display type and battery voltage usually live in the product title
  const displayMatch = /((?:O)?LED Display)/i.exec(product.name)?.[1];
  const batteryMatch = /(\d+V\s*\/\s*\d+V)/i.exec(product.name)?.[1];
  // Meaningless placeholder values that should never become tiles
  const notReal = (value: string) =>
    /^(no|none|not included|n\/a|-)$/i.test(value.trim());
  const pick = (keys: string[]): string | null => {
    const value = specLookup(keys);
    return value && !notReal(value) ? value : null;
  };
  const keySpecs = (
    [
      { label: "Model", value: product.model ?? pick(["Model Number", "Model"]) },
      { label: "Type", value: pick(["Type", "Controller Type", "Product Type"]) },
      {
        label: "System Voltage",
        value: pick(["Rated Voltage", "System Voltage", "Rated Output Voltage", "Output Voltage"]),
      },
      { label: "Max Current", value: pick(["Maximum Current", "Max Current", "Maximum Output Current"]) },
      { label: "Max PV Power", value: pick(["Max PV Power", "Maximum PV Power", "PV Power"]) },
      {
        label: "Max PV Voltage",
        value: pick(["Max PV Voltage", "Maximum PV Voltage", "Max Voltage", "PV Voltage", "Input (PV) Voltage Range"]),
      },
      { label: "Display", value: pick(["Display", "Screen"]) ?? displayMatch },
      { label: "Battery", value: pick(["Battery Type", "Battery Voltage"]) ?? batteryMatch },
    ] as Array<{ label: string; value: string | null }>
  ).filter((item): item is { label: string; value: string } => Boolean(item.value));
  const cartItem = {
    slug: product.slug,
    name: product.name,
    battery: [product.brand, product.model].filter(Boolean).join(" · ") || categoryLabel(product.category),
    price: Number(product.price),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex min-w-0 items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-navy">{d.products.home}</Link>
        <span aria-hidden>/</span>
        <Link href="/products" className="hover:text-navy">Products</Link>
        <span aria-hidden>/</span>
        <span className="truncate text-navy">{product.name}</span>
      </nav>

      {/* Product grid */}
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        {/* Image gallery */}
        <ProductGallery
          images={[product.imageUrl, ...(product.images ?? [])].filter(
            (v): v is string => Boolean(v),
          )}
          name={product.name}
          discountPct={product.discountPct}
        />

        {/* Info */}
        <div>
          <p className="text-sm font-semibold uppercase text-solar-dark">
            {categoryLabel(product.category)}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy">{product.name}</h1>
          {product.description ? (
            <p className="mt-3 leading-relaxed text-muted-foreground">{product.description}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="bg-gradient-to-r from-solar-dark to-solar bg-clip-text text-3xl font-extrabold text-transparent">
              {formatPrice(product.price, settings.currency)}
            </span>
            {original ? (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(original, settings.currency)}
              </span>
            ) : null}
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-leaf">
            <span className="size-2 rounded-full bg-leaf" aria-hidden />
            {product.stock > 0 ? d.products.inStock : d.products.outOfStock}
            {product.stock > 0 ? (
              <span className="font-normal text-muted-foreground">
                ({product.stock} available)
              </span>
            ) : null}
          </p>

          {/* Key spec tiles — 4 per row, right after the price */}
          {keySpecs.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 sm:grid-cols-4">
              {keySpecs.map((item) => (
                <div key={item.label} className="rounded-xl bg-secondary/60 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-bold text-navy" title={item.value}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Buttons — stacked on mobile, one row on desktop */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AddToCartButton
              size="lg"
              label={d.products.addToCart}
              addedLabel={d.products.added}
              className="h-12 w-full font-bold sm:w-auto sm:flex-1"
              item={cartItem}
            />
            <AddToCartButton
              size="lg"
              label={d.products.buyNow}
              addedLabel={d.products.buyNowDone}
              goToCart
              className="h-12 w-full border border-navy bg-white font-bold text-navy hover:bg-secondary sm:w-auto sm:flex-1"
              item={cartItem}
            />
            <WhatsAppButton
              className="h-12 w-full sm:w-auto sm:flex-1"
              label={d.products.whatsappOrder}
              href={whatsappUrl(
                settings.whatsapp,
                `I want to order: ${product.name} (${formatPrice(product.price, settings.currency)})`,
              )}
            />
          </div>

          {/* Trust lines */}
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Wallet className="size-4 text-leaf" aria-hidden />
              {d.products.cod}
            </li>
            <li className="flex items-center gap-1.5">
              <Truck className="size-4 text-leaf" aria-hidden />
              {d.products.delivery}
            </li>
            {product.warrantyMonths > 0 ? (
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-leaf" aria-hidden />
                {product.warrantyMonths >= 12
                  ? fmt(d.products.warrantyY, { n: product.warrantyMonths / 12 })
                  : fmt(d.products.warrantyM, { n: product.warrantyMonths })}
              </li>
            ) : null}
          </ul>

        </div>
      </div>

      {/* Key attributes — two-column grid; Place of Origin hidden on page */}
      {specs.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-bold tracking-tight text-navy text-3xl sm:text-4xl">
            Key attributes
          </h2>
          <div className="mt-4 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2">
            {specs
              .filter(([key]) => key.toLowerCase() !== "place of origin")
              .map(([key, value]) => (
                <div key={key} className="bg-card px-4 py-3 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">{key}</p>
                  <p className="mt-0.5 font-semibold text-navy">{value}</p>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      {/* Packaging and delivery */}
      {packagingEntries.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-bold tracking-tight text-navy text-3xl sm:text-4xl">
            Packaging and delivery
          </h2>
          <div className="mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <tbody>
                {packagingEntries.map(([key, value], i) => (
                  <tr key={key} className={i % 2 === 0 ? "bg-secondary/40" : ""}>
                    <th className="w-1/3 px-4 py-3 text-left font-medium text-muted-foreground sm:w-1/4">
                      {key}
                    </th>
                    <td className="px-4 py-3 font-semibold text-navy">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Related products */}
      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-bold tracking-tight text-navy text-3xl sm:text-4xl">
            Complete your system
          </h2>
          <p className="mt-2 text-muted-foreground">
            {fmt(d.products.relatedSub, { n: categoryLabel(product.category) })}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} currency={settings.currency} d={d} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
