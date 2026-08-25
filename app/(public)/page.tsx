import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PackageCard } from "@/components/site/package-card";
import { ProductCard } from "@/components/products/product-card";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { HomeCalculator } from "@/components/home/home-calculator";
import {
  getActiveAppliances,
  getBackupPackages,
  getCalculationSettings,
  getCategoryCounts,
  getHomeProducts,
  getSettings,
} from "@/lib/queries";
import { fmt, getDict, num } from "@/lib/i18n";
import {
  PRODUCT_CATEGORIES,
  categoryIcon,
  categoryLabelBn,
} from "@/lib/categories";
import { whatsappUrl } from "@/lib/whatsapp";

export default async function HomePage() {
  const [{ lang, d }, settings, calcSettings, appliances, packages, homeProducts, categoryCounts] =
    await Promise.all([
      getDict(),
      getSettings(),
      getCalculationSettings(),
      getActiveAppliances(),
      getBackupPackages(),
      getHomeProducts(6),
      getCategoryCounts(),
    ]);
  // Show every package on the homepage; the featured one goes last (3rd).
  const popular = [...packages].sort(
    (a, b) => Number(a.featured) - Number(b.featured),
  );
  const categoriesWithProducts = PRODUCT_CATEGORIES.filter(
    (c) => (categoryCounts.get(c.slug) ?? 0) > 0,
  ).map((c) => ({ ...c, count: categoryCounts.get(c.slug) ?? 0 }));

  const howSteps = [
    { step: num(1, lang), title: d.how.s1t, desc: d.how.s1d },
    { step: num(2, lang), title: d.how.s2t, desc: d.how.s2d },
    { step: num(3, lang), title: d.how.s3t, desc: d.how.s3d },
  ];

  return (
    <div>
      {/* 1. Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:py-20">
          <p className="text-sm font-semibold tracking-wide text-solar">
            {settings.businessName} — {d.hero.tagline}
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-snug sm:text-4xl lg:text-5xl">
            {d.hero.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            {d.hero.sub.replace("SunVolt", settings.businessName)}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 bg-solar text-base font-bold text-navy hover:bg-solar-dark hover:text-navy"
            >
              <Link href="/calculator">{d.hero.ctaCalc}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 border-white/30 bg-transparent text-base font-bold text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/packages">{d.hero.ctaPackages}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Interactive calculator — the star of the homepage */}
      <section className="-mt-8 pb-4 pt-0 sm:-mt-12">
        <HomeCalculator
          currency={settings.currency}
          phone={settings.phone}
          whatsapp={settings.whatsapp}
          calcSettings={calcSettings}
          lang={lang}
          d={d}
          appliances={appliances.map((a) => ({
            id: a.id,
            name: a.name,
            defaultWatt: a.defaultWatt,
            icon: a.icon,
            category: a.category,
          }))}
          packages={popular.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            batteryVoltage: Number(p.batteryVoltage ?? 0),
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
        <h2 className="text-center text-2xl font-bold text-navy">{d.how.title}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {howSteps.map((item) => (
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
              <h2 className="text-2xl font-bold text-navy">{d.popular.title}</h2>
              <p className="mt-1 text-muted-foreground">{d.popular.sub}</p>
            </div>
            <Link
              href="/packages"
              className="hidden shrink-0 text-sm font-semibold text-navy hover:underline sm:block"
            >
              {d.popular.viewAll}
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
                  lang={lang}
                  d={d}
                />
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              {d.popular.empty}
            </p>
          )}
        </div>
      </section>

      {/* 4.5 Featured products */}
      {homeProducts.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-solar-dark">
                {d.featured.kicker}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-navy">{d.featured.title}</h2>
              <p className="mt-1 text-muted-foreground">{d.featured.sub}</p>
            </div>
            <Link
              href="/products"
              className="shrink-0 text-sm font-semibold text-navy hover:underline"
            >
              {d.featured.more}
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {homeProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={settings.currency}
                d={d}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 5. Browse by category */}
      {categoriesWithProducts.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-solar-dark">
            {d.cat.kicker}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-navy">{d.cat.title}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categoriesWithProducts.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="group rounded-2xl border bg-card p-5 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="text-3xl" aria-hidden>
                  {categoryIcon(category.slug)}
                </span>
                <p className="mt-3 text-sm font-bold text-navy group-hover:underline">
                  {lang === "bn" ? categoryLabelBn(category.slug) : category.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {fmt(d.cat.items, { n: num(category.count, lang) })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* 6. Which package is for you? */}
      {popular.length > 0 ? (
        <section className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold text-navy">{d.compare.title}</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{d.compare.need}</th>
                  <th className="px-4 py-3 text-right">{d.compare.pkg}</th>
                </tr>
              </thead>
              <tbody>
                {popular
                  .slice()
                  .sort((a, b) => (a.batteryCapacityAh ?? 0) - (b.batteryCapacityAh ?? 0))
                  .map((product, i, arr) => (
                    <tr key={product.id} className="border-t">
                      <td className="px-4 py-3">
                        🌀 {num(product.exampleFanCount ?? 2, lang)} {lang === "bn" ? "টি" : "×"} Fan + 💡{" "}
                        {num(product.exampleLightCount ?? 1, lang)} {lang === "bn" ? "টি" : "×"} Light
                        {i === arr.length - 1 && arr.length > 1
                          ? ` ${d.compare.longBackup}`
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
          <p className="mt-3 text-center text-xs text-muted-foreground">{d.compare.note}</p>
          <div className="mt-5 text-center">
            <span className="text-sm text-muted-foreground">{d.compare.notSure}</span>{" "}
            <Button asChild size="lg" className="mt-2 h-13 font-bold">
              <Link href="/calculator">{d.compare.calcBtn}</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {/* 7. Why SunVolt */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-navy">{d.why.title}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {d.why.items.map((item) => (
            <div key={item.title} className="rounded-2xl border bg-card p-5 text-center shadow-sm">
              <span className="text-3xl" aria-hidden>{item.icon}</span>
              <h3 className="mt-3 text-sm font-semibold text-navy">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Solar System Flow */}
      <section className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-bold">{d.flow.title}</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/70">{d.flow.sub}</p>
          <ol className="mt-10 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-0">
            {d.flow.steps.map((label, i) => (
              <li key={label} className="flex items-center gap-2 sm:gap-0">
                <div className="flex w-36 flex-col items-center rounded-2xl bg-white/10 px-3 py-4">
                  <span className="text-3xl" aria-hidden>
                    {["☀️", "⚡", "🔋", "🌀"][i]}
                  </span>
                  <span className="mt-2 text-sm font-medium">{label}</span>
                </div>
                {i < d.flow.steps.length - 1 ? (
                  <span className="px-2 text-xl text-solar sm:px-3" aria-hidden>↓</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-navy">{d.faq.title}</h2>
        <Accordion type="single" collapsible className="mt-8">
          {d.faq.items.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold text-navy">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 10. Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl bg-leaf/10 px-6 py-10 text-center ring-1 ring-leaf/30">
          <h2 className="text-2xl font-bold text-navy">{d.finalCta.title}</h2>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">{d.finalCta.sub}</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-13 font-bold">
              <Link href="/calculator">{d.finalCta.calc}</Link>
            </Button>
            <WhatsAppButton
              label={d.finalCta.whatsapp}
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
