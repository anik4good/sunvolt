import { getSettings } from "@/lib/queries";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { FloatingCta } from "@/components/site/floating-cta";
import { CartProvider } from "@/components/cart/cart-provider";

export default async function PublicLayout({
  children,
}: LayoutProps<"/">) {
  const settings = await getSettings();

  return (
    <CartProvider>
      <Header
        businessName={settings.businessName}
        phone={settings.phone}
        whatsapp={settings.whatsapp}
      />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer
        businessName={settings.businessName}
        phone={settings.phone}
        whatsapp={settings.whatsapp}
        address={settings.address}
      />
      <FloatingCta phone={settings.phone} whatsapp={settings.whatsapp} />
    </CartProvider>
  );
}
