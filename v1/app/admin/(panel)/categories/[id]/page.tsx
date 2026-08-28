import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata = { title: "Edit Category | SunVolt Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  const category = rows[0];
  if (!category) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Edit: {category.label}</h1>
      <CategoryForm category={category} />
    </div>
  );
}
