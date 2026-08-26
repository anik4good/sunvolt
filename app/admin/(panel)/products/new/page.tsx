import { ProductForm } from "@/components/admin/product-form";
import { getSettings } from "@/lib/queries";
import { parsePanelRates } from "@/lib/panel-rates";

export const metadata = { title: "New Product | SunVolt Admin" };

export default async function NewProductPage() {
  const settings = await getSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">New Product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a solar backup package. It appears on the website as soon as it is active.
      </p>
      <ProductForm panelRates={parsePanelRates(settings.panelRates)} />
    </div>
  );
}
