import { CategoryForm } from "@/components/admin/category-form";

export const metadata = { title: "New Category | SunVolt Admin" };

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">New Category</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Categories created here appear everywhere — product form, filters and
        the public site.
      </p>
      <CategoryForm />
    </div>
  );
}
