import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, Truck, Wallet, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { ProductCard } from "@/components/products/product-card";
import { categoryLabel } from "@/lib/categories";
import { getProductBySlug, getRelatedProducts, getSettings } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";

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

  const [settings, related] = await Promise.all([
    getSettings(),
    getRelatedProducts(slug, product.category),
  ]);

  const original =
    product.discountPct > 0
      ? Math.round(Number(product.price) / (1 - product.discountPct / 100))
      : null;
  const specs = Object.entries(product.specs ?? {});
  const features = product.features ?? [];
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
        <Link href="/" className="hover:text-navy">Home</Link>
        <span aria-hidden>/</span>
        <Link href="/products" className="hover:text-navy">Products</Link>
        <span aria-hidden>/</span>
        <span className="truncate text-navy">{product.name}</span>
      </nav>

      {/* Product grid */}
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        {/* Image */}
        <div className="relative overflow-hidden rounded-2xl border bg-white">
          <div className="relative aspect-square">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 550px"
                priority
                className="object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-6xl" aria-hidden>
                ⚡
              </span>
            )}
          </div>
          {product.discountPct > 0 ? (
            <Badge className="absolute left-3 top-3 bg-destructive text-white">
              −{product.discountPct}%
            </Badge>
          ) : null}
        </div>

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
            {product.stock > 0 ? "In stock" : "Out of stock"}
            {product.stock > 0 ? (
              <span className="font-normal text-muted-foreground">
                ({product.stock} available)
              </span>
            ) : null}
          </p>

          {/* Buttons — stacked on mobile, one row on desktop */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AddToCartButton
              size="lg"
              label="Add to cart"
              addedLabel="Added ✓"
              className="h-12 w-full font-bold sm:w-auto sm:flex-1"
              item={cartItem}
            />
            <AddToCartButton
              size="lg"
              label="Buy now"
              addedLabel="Opening cart…"
              goToCart
              className="h-12 w-full border border-navy bg-white font-bold text-navy hover:bg-secondary sm:w-auto sm:flex-1"
              item={cartItem}
            />
            <WhatsAppButton
              className="h-12 w-full sm:w-auto sm:flex-1"
              label="Order on WhatsApp"
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
              Cash on Delivery available
            </li>
            <li className="flex items-center gap-1.5">
              <Truck className="size-4 text-leaf" aria-hidden />
              Delivery in 3–5 days
            </li>
            {product.warrantyMonths > 0 ? (
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-leaf" aria-hidden />
                {product.warrantyMonths >= 12
                  ? `${product.warrantyMonths / 12} Year Warranty`
                  : `${product.warrantyMonths} Month Warranty`}
              </li>
            ) : null}
          </ul>

          {/* Features */}
          {features.length > 0 ? (
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-leaf" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Specifications / additional details */}
      {specs.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-bold tracking-tight text-navy text-3xl sm:text-4xl">
            Specifications
          </h2>
          <div className="mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <tbody>
                {specs.map(([key, value], i) => (
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
            More from {categoryLabel(product.category)}.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} currency={settings.currency} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
