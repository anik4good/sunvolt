import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  variable: "--font-sans",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
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

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background font-sans">
        {children}
      </body>
    </html>
  );
}
