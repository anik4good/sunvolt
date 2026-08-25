import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New Product | SunVolt Admin" };

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">New Product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a solar backup package. It appears on the website as soon as it is active.
      </p>
      <ProductForm />
    </div>
  );
}
