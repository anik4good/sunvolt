import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PackageCard } from "@/components/site/package-card";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { HomeCalculator } from "@/components/home/home-calculator";
import {
  getActiveAppliances,
  getBackupPackages,
  getCalculationSettings,
  getSettings,
} from "@/lib/queries";
import { whatsappUrl } from "@/lib/whatsapp";

const FAQ_ITEMS = [
  {
    q: "ব্যাকআপ সময় কি নিশ্চিত?",
    a: "ব্যাকআপ সময় আপনার ডিভাইসের মোট লোড, ব্যবহারের ধরন এবং ব্যাটারির অবস্থার উপর নির্ভর করে। আমাদের ক্যালকুলেটর আপনার প্রয়োজন অনুযায়ী উপযুক্ত প্যাকেজ নির্বাচন করতে সাহায্য করবে।",
  },
  {
    q: "কোন ব্যাটারি ব্যবহার করা হয়?",
    a: "আমাদের প্যাকেজে LiFePO4 Lithium Battery ব্যবহার করা হয়।",
  },
  {
    q: "ইনস্টলেশন কি প্রয়োজন?",
    a: "হ্যাঁ। সঠিক ও নিরাপদ সংযোগের জন্য আমাদের ইনস্টলেশন সার্ভিস নেওয়া পরামর্শ দেওয়া হয়।",
  },
  {
    q: "ওয়ারেন্টি কতদিন?",
    a: "প্যাকেজ অনুযায়ী ওয়ারেন্টির সময় আলাদা হতে পারে। প্রতিটি প্যাকেজের বিস্তারিত পেজে ওয়ারেন্টি উল্লেখ করা আছে।",
  },
  {
    q: "কীভাবে অর্ডার করব?",
    a: "প্যাকেজ নির্বাচন করে অনলাইনে অর্ডার করতে পারেন অথবা WhatsApp-এ সরাসরি আমাদের সাথে যোগাযোগ করতে পারেন।",
  },
];

const WHY_ITEMS = [
  { icon: "🔋", title: "LiFePO4 ব্যাটারি", desc: "দীর্ঘস্থায়ী ও নিরাপদ ব্যাটারি" },
  { icon: "☀️", title: "সোলার চার্জিং", desc: "সূর্যের আলোতেই ব্যাটারি চার্জ" },
  { icon: "💰", title: "বিদ্যুৎ খরচ কমাতে সাহায্য করে", desc: "সোলার শক্তি ব্যবহার করে" },
  { icon: "🔧", title: "কম রক্ষণাবেক্ষণ", desc: "কম রক্ষণাবেক্ষণে দীর্ঘদিন ব্যবহার করুন" },
  { icon: "🤝", title: "সার্ভিস ও সাপোর্ট", desc: "প্রয়োজনে SunVolt টিম পাশে আছে" },
];

const FLOW_STEPS = [
  { icon: "☀️", label: "সোলার প্যানেল" },
  { icon: "⚡", label: "চার্জ কন্ট্রোলার" },
  { icon: "🔋", label: "ব্যাটারি" },
  { icon: "🌀", label: "ফ্যান + লাইট" },
];

const HOW_STEPS = [
  {
    step: "১",
    title: "ডিভাইস নির্বাচন করুন",
    desc: "আপনি কী কী চালাতে চান এবং কতটি?",
  },
  {
    step: "২",
    title: "ব্যাকআপ সময় দিন",
    desc: "আপনার কত ঘণ্টা ব্যাকআপ প্রয়োজন?",
  },
  {
    step: "৩",
    title: "প্যাকেজ বেছে নিন",
    desc: "SunVolt হিসাব করে উপযুক্ত প্যাকেজ দেখাবে",
  },
];

export default async function HomePage() {
  const [settings, calcSettings, appliances, packages] = await Promise.all([
    getSettings(),
    getCalculationSettings(),
    getActiveAppliances(),
    getBackupPackages(),
  ]);
  // Show every package on the homepage; the featured one goes last (3rd).
  const popular = [...packages].sort(
    (a, b) => Number(a.featured) - Number(b.featured),
  );

  return (
    <div>
      {/* 1. Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:py-20">
          <p className="text-sm font-semibold tracking-wide text-solar">
            {settings.businessName} — সূর্যের শক্তি, আপনার নির্ভরতা
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-snug sm:text-4xl lg:text-5xl">
            বিদ্যুৎ চলে গেলেও আপনার ফ্যান-লাইট চলবে
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            আপনার কতগুলো ফ্যান, লাইট বা অন্যান্য ডিভাইস চালাতে চান বলুন —{" "}
            {settings.businessName} আপনার জন্য উপযুক্ত সোলার ব্যাকআপ প্যাকেজ
            সাজেস্ট করবে।
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 bg-solar text-base font-bold text-navy hover:bg-solar-dark hover:text-navy"
            >
              <Link href="/calculator">🔋 আমার ব্যাকআপ হিসাব করুন</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 border-white/30 bg-transparent text-base font-bold text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/packages">📦 প্যাকেজ দেখুন</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Interactive calculator — the star of the homepage */}
      <section className="-mt-8 pb-4 pt-0 sm:-mt-12">
        <HomeCalculator
          currency={settings.currency}
          calcSettings={calcSettings}
          appliances={appliances.map((a) => ({
            id: a.id,
            name: a.name,
            defaultWatt: a.defaultWatt,
            icon: a.icon,
          }))}
          packages={popular.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            batteryVoltage: p.batteryVoltage ?? 0,
            batteryCapacityAh: p.batteryCapacityAh ?? 0,
            recommendedLoadWatt: p.recommendedLoadWatt ?? 0,
            backupHours: p.backupHours ?? 0,
            active: p.active,
            price: p.price,
          }))}
        />
      </section>

      {/* 3. How It Works — 3 steps */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-navy">
          মাত্র ৩টি সহজ ধাপে আপনার জন্য সঠিক প্যাকেজ খুঁজে নিন
        </h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {HOW_STEPS.map((item) => (
            <li
              key={item.step}
              className="rounded-2xl border bg-card p-5 text-center shadow-sm"
            >
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-navy text-lg font-bold text-solar">
                {item.step}
              </span>
              <h3 className="mt-3 font-semibold text-navy">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Popular Packages */}
      <section className="bg-secondary/50 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-navy">জনপ্রিয় প্যাকেজ</h2>
              <p className="mt-1 text-muted-foreground">
                আপনার প্রয়োজন অনুযায়ী প্রস্তুত সোলার ব্যাকআপ প্যাকেজ
              </p>
            </div>
            <Link
              href="/packages"
              className="hidden shrink-0 text-sm font-semibold text-navy hover:underline sm:block"
            >
              সব প্যাকেজ →
            </Link>
          </div>
          {popular.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((product) => (
                <PackageCard
                  key={product.id}
                  product={product}
                  currency={settings.currency}
                  featured={product.featured}
                />
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              শীঘ্রই আমাদের প্যাকেজ আসছে। জানতে WhatsApp করুন।
            </p>
          )}
        </div>
      </section>

      {/* 5. Which package is for you? */}
      {popular.length > 0 ? (
        <section className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold text-navy">
            কোন প্যাকেজটি আপনার জন্য?
          </h2>
          <div className="mt-6 overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">আপনার প্রয়োজন (উদাহরণ)</th>
                  <th className="px-4 py-3 text-right">প্যাকেজ</th>
                </tr>
              </thead>
              <tbody>
                {popular
                  .slice()
                  .sort((a, b) => (a.batteryCapacityAh ?? 0) - (b.batteryCapacityAh ?? 0))
                  .map((product, i, arr) => (
                    <tr key={product.id} className="border-t">
                      <td className="px-4 py-3">
                        🌀 {i === 0 ? "১টি" : "২টি"} Fan + 💡 ১টি Light
                        {i === arr.length - 1 && arr.length > 1
                          ? " — দীর্ঘ ব্যাকআপসহ"
                          : ""}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/packages/${product.slug}`}
                          className="font-bold text-navy hover:underline"
                        >
                          {product.name}
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            *উদাহরণ হিসেবে দেখানো — আপনার প্রকৃত প্রয়োজন হিসাব করে জানুন।
          </p>
          <div className="mt-5 text-center">
            <span className="text-sm text-muted-foreground">নিশ্চিত নন?</span>{" "}
            <Button asChild size="lg" className="mt-2 h-13 font-bold">
              <Link href="/calculator">🔋 আপনার ব্যাকআপ হিসাব করুন</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {/* 6. Why SunVolt */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-navy">কেন SunVolt?</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {WHY_ITEMS.map((item) => (
            <div key={item.title} className="rounded-2xl border bg-card p-5 text-center shadow-sm">
              <span className="text-3xl" aria-hidden>{item.icon}</span>
              <h3 className="mt-3 text-sm font-semibold text-navy">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Solar System Flow */}
      <section className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-bold">সোলার সিস্টেম কীভাবে কাজ করে?</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/70">
            সূর্যের আলো থেকে ব্যাটারি চার্জ হয়, আর প্রয়োজনে সেই শক্তি আপনার
            ডিভাইসে ব্যবহার হয়।
          </p>
          <ol className="mt-10 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-0">
            {FLOW_STEPS.map((step, i) => (
              <li key={step.label} className="flex items-center gap-2 sm:gap-0">
                <div className="flex w-36 flex-col items-center rounded-2xl bg-white/10 px-3 py-4">
                  <span className="text-3xl" aria-hidden>{step.icon}</span>
                  <span className="mt-2 text-sm font-medium">{step.label}</span>
                </div>
                {i < FLOW_STEPS.length - 1 ? (
                  <span className="px-2 text-xl text-solar sm:px-3" aria-hidden>↓</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-navy">
          সাধারণ প্রশ্নোত্তর
        </h2>
        <Accordion type="single" collapsible className="mt-8">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold text-navy">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 9. Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl bg-leaf/10 px-6 py-10 text-center ring-1 ring-leaf/30">
          <h2 className="text-2xl font-bold text-navy">
            আপনার জন্য সঠিক সোলার প্যাকেজ খুঁজে নিন
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            কতগুলো ফ্যান, লাইট বা অন্যান্য ডিভাইস চালাবেন বলুন। আমরা আপনার
            প্রয়োজন অনুযায়ী প্যাকেজ সাজেস্ট করব।
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-13 font-bold">
              <Link href="/calculator">🔋 ব্যাকআপ হিসাব করুন</Link>
            </Button>
            <WhatsAppButton
              label="💬 WhatsApp-এ কথা বলুন"
              href={whatsappUrl(
                settings.whatsapp,
                "Assalamu Alaikum SunVolt, আমি SunVolt সোলার প্যাকেজ সম্পর্কে জানতে চাই।",
              )}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
