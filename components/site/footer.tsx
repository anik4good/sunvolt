import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { whatsappUrl } from "@/lib/whatsapp";

interface FooterProps {
  businessName: string;
  phone: string;
  whatsapp: string;
  address: string;
}

export function Footer({ businessName, phone, whatsapp, address }: FooterProps) {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <span className="inline-flex rounded-xl bg-white px-3 py-1.5">
            <Image
              src="/logo.png"
              alt={`${businessName} লোগো`}
              width={160}
              height={46}
              className="h-9 w-auto"
            />
          </span>
          <p className="mt-3 text-sm text-white/70">
            সূর্যের শক্তি, আপনার নির্ভরতা — লোডশেডিং চলাকালীন নির্ভরযোগ্য
            সোলার ব্যাকআপ সমাধান।
          </p>
        </div>

        <nav aria-label="ফুটার মেনু">
          <h3 className="text-sm font-semibold text-solar">দ্রুত লিংক</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <Link href="/calculator" className="hover:text-white">
                ব্যাকআপ হিসাব করুন
              </Link>
            </li>
            <li>
              <Link href="/packages" className="hover:text-white">
                সব প্যাকেজ
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-white">
                Products
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">
                আমাদের সম্পর্কে
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                যোগাযোগ
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-semibold text-solar">যোগাযোগ</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <a href={`tel:${phone}`} className="hover:text-white">
                📞 {phone}
              </a>
            </li>
            <li>
              <a
                href={whatsappUrl(whatsapp, "Assalamu Alaikum SunVolt, আমি SunVolt সোলার প্যাকেজ সম্পর্কে জানতে চাই।")}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                💬 WhatsApp: {phone}
              </a>
            </li>
            {address ? <li>📍 {address}</li> : null}
          </ul>
        </div>
      </div>

      <Separator className="bg-white/15" />
      <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {businessName}. সর্বস্বত্ব সংরক্ষিত।
      </div>
    </footer>
  );
}
