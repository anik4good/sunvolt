import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getSettings } from "@/lib/queries";
import { getDict } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getDict();
  return { title: d.checkout.title };
}

export default async function CheckoutPage() {
  const [{ lang, d }, settings] = await Promise.all([getDict(), getSettings()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-navy">{d.checkout.title}</h1>
      <p className="mt-2 text-muted-foreground">{d.checkout.sub}</p>
      <CheckoutForm currency={settings.currency} lang={lang} d={d} />
    </div>
  );
}
