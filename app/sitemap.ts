import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/calculator",
    "/packages",
    "/products",
    "/about",
    "/contact",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  // The Docker image builds without database access — fall back to the
  // static routes so the build never fails, and product URLs appear at
  // runtime once the DB is reachable.
  try {
    const products = await getActiveProducts();
    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${base}${p.category === "package" ? "/packages" : "/products"}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    }));
    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
