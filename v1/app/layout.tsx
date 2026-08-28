import type { Metadata, Viewport } from "next";
import { Manrope, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { getLang } from "@/lib/i18n";

// Same pairing as SurjoOne: Manrope for Latin, Noto Sans Bengali for Bengali.
// Latin-first stack keeps digits clean; Bengali falls through to Noto.
const manrope = Manrope({
  variable: "--font-latin",
  subsets: ["latin"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SunVolt — সূর্যের শক্তি, আপনার নির্ভরতা",
    template: "%s | SunVolt",
  },
  description:
    "লোডশেডিং চলাকালীন ফ্যান, লাইট, টিভি ও রাউটার চালানোর জন্য প্রস্তুত সোলার ব্যাকআপ প্যাকেজ। আপনার প্রয়োজন হিসাব করুন, উপযুক্ত প্যাকেজ বেছে নিন।",
  openGraph: {
    type: "website",
    siteName: "SunVolt",
    title: "SunVolt — সূর্যের শক্তি, আপনার নির্ভরতা",
    description:
      "বিদ্যুৎ চলে গেলেও আপনার প্রয়োজনীয় ডিভাইস চালান — SunVolt সোলার ব্যাকআপ প্যাকেজ।",
  },
};

export const viewport: Viewport = {
  themeColor: "#12335c",
  width: "device-width",
  initialScale: 1,
};

// Prices, packages and settings live in the database and can change in the
// admin dashboard at any time (plan §33), so pages always render fresh.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html
      lang={lang}
      className={`${manrope.variable} ${notoSansBengali.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background font-sans">
        {children}
      </body>
    </html>
  );
}
