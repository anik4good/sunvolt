import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { getDict } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getDict();
  return { title: d.cart.title };
}

export default async function CartPage() {
  const { lang, d } = await getDict();
  return <CartView d={d} lang={lang} />;
}
