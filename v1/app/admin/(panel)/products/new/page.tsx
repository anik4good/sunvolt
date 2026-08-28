import { ProductForm } from "@/components/admin/product-form";
import { getCategories, getSettings } from "@/lib/queries";
import { parsePanelRates } from "@/lib/panel-rates";

export const metadata = { title: "New Product | SunVolt Admin" };

export default async function NewProductPage() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const options = categories
    .filter((c) => c.active)
    .map((c) => ({ slug: c.slug, label: c.label }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">New Product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a solar backup package. It appears on the website as soon as it is active.
      </p>
      <ProductForm panelRates={parsePanelRates(settings.panelRates)} categories={options} />
    </div>
  );
}
