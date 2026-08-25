import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "আমাদের সম্পর্কে",
  description:
    "SunVolt — লোডশেডিং-প্রভাবিত বাংলাদেশে নির্ভরযোগ্য সোলার ব্যাকআপ সমাধানের প্রতিশ্রুতি।",
};

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-navy">
        {settings.businessName} সম্পর্কে
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        সূর্যের শক্তি, আপনার নির্ভরতা
      </p>

      <div className="mt-8 space-y-5 leading-relaxed text-muted-foreground">
        <p>
          লোডশেডিং এখন আমাদের নিত্যদিনের বাস্তবতা। বিদ্যুৎ চলে গেলে ফ্যান
          বন্ধ, লাইট বন্ধ, ইন্টারনেট বন্ধ — জীবনযাত্রা থেমে যায়।{" "}
          {settings.businessName} তৈরি হয়েছে এই সমস্যার সহজ সমাধান দিতে।
        </p>
        <p>
          আমরা প্রস্তুত সোলার ব্যাকআপ প্যাকেজ বিক্রি করি — LiFePO4 লিথিয়াম
          ব্যাটারি, সোলার প্যানেল ও চার্জ কন্ট্রোলার নিয়ে সম্পূর্ণ সেট।
          কোন প্যাকেজ আপনার জন্য উপযুক্ত, তা আপনাকে নিজে হিসাব করতে হবে না —
          আমাদের স্মার্ট হিসাব যন্ত্র আপনার প্রয়োজন শুনে সাজেস্ট করবে।
        </p>
        <p>
          আমাদের লক্ষ্য সহজ: কোনো জটিল টেকনিক্যাল কথা ছাড়াই প্রতিটি
          পরিবার লোডশেডিং-নির্ভরতা থেকে মুক্তি পাক।
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: "🔋", title: "LiFePO4 ব্যাটারি", desc: "নিরাপদ ও দীর্ঘস্থায়ী" },
          { icon: "🛠️", title: "প্রফেশনাল ইনস্টলেশন", desc: "অভিজ্ঞ টেকনিশিয়ান টিম" },
          { icon: "📞", title: "সহজ যোগাযোগ", desc: "কল বা WhatsApp — যেভাবে সুবিধা" },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border bg-card p-5 text-center">
            <span className="text-3xl" aria-hidden>{item.icon}</span>
            <h2 className="mt-3 text-sm font-bold text-navy">{item.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="font-bold">
          <Link href="/calculator">নিজের ব্যাকআপ হিসাব করুন</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/contact">যোগাযোগ করুন</Link>
        </Button>
      </div>
    </div>
  );
}
