import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ProductForm } from "@/components/admin/product-form";
import { getSettings } from "@/lib/queries";
import { parsePanelRates } from "@/lib/panel-rates";

export const metadata = { title: "Edit Product | SunVolt Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [rows, settings] = await Promise.all([
    db.select().from(products).where(eq(products.id, id)).limit(1),
    getSettings(),
  ]);
  const product = rows[0];
  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Edit: {product.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Changes go live immediately — the website reads this data on every request.
      </p>
      <ProductForm product={product} panelRates={parsePanelRates(settings.panelRates)} />
    </div>
  );
}
