import type { Metadata } from "next";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { getSettings } from "@/lib/queries";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "যোগাযোগ",
  description:
    "SunVolt-এর সাথে যোগাযোগ করুন — কল করুন বা WhatsApp-এ মেসেজ দিন। সোলার ব্যাকআপ প্যাকেজ সম্পর্কে যেকোনো প্রশ্নের উত্তর পাবেন।",
};

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-navy">যোগাযোগ করুন</h1>
      <p className="mt-2 text-muted-foreground">
        সোলার প্যাকেজ, ইনস্টলেশন বা কাস্টম সিস্টেম — যেকোনো বিষয়ে আমাদের
        জানান। আমরা সাধারণত দ্রুত উত্তর দিই।
      </p>

      <div className="mt-8 space-y-4">
        <a
          href={`tel:${settings.phone}`}
          className="flex items-center gap-4 rounded-2xl border bg-card p-5 hover:bg-secondary/50"
        >
          <span className="flex size-12 items-center justify-center rounded-xl bg-navy text-xl text-white">
            📞
          </span>
          <div>
            <p className="text-sm text-muted-foreground">কল করুন</p>
            <p className="text-lg font-bold text-navy">{settings.phone}</p>
          </div>
        </a>

        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-whatsapp text-xl text-white">
              💬
            </span>
            <div>
              <p className="text-sm text-muted-foreground">WhatsApp</p>
              <p className="text-lg font-bold text-navy">{settings.phone}</p>
            </div>
          </div>
          <WhatsAppButton
            className="mt-4 w-full"
            href={whatsappUrl(
              settings.whatsapp,
              "Assalamu Alaikum SunVolt, আমি সোলার প্যাকেজ সম্পর্কে জানতে চাই।",
            )}
          />
        </div>

        {settings.address ? (
          <div className="flex items-center gap-4 rounded-2xl border bg-card p-5">
            <span className="flex size-12 items-center justify-center rounded-xl bg-solar-light text-xl">
              📍
            </span>
            <div>
              <p className="text-sm text-muted-foreground">ঠিকানা</p>
              <p className="text-base font-semibold text-navy">{settings.address}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
