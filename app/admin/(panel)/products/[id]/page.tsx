import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Edit Product | SunVolt Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  const product = rows[0];
  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Edit: {product.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Changes go live immediately — the website reads this data on every request.
      </p>
      <ProductForm product={product} />
    </div>
  );
}
