import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/queries";
import { fmt, getDict } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getDict();
  return { title: d.about.title, description: d.footer.tagline };
}

export default async function AboutPage() {
  const [{ d }, settings] = await Promise.all([getDict(), getSettings()]);

    const paragraphs = [
    fmt(d.about.p1, { brand: settings.businessName }),
    d.about.p2,
    d.about.p3,
  ];
  const cards = [
    { icon: "🔋", title: d.about.c1t, desc: d.about.c1d },
    { icon: "🛠️", title: d.about.c2t, desc: d.about.c2d },
    { icon: "📞", title: d.about.c3t, desc: d.about.c3d },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-navy">{d.about.title}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{d.hero.tagline}</p>

      <div className="mt-8 space-y-5 leading-relaxed text-muted-foreground">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {cards.map((item) => (
          <div key={item.title} className="rounded-2xl border bg-card p-5 text-center">
            <span className="text-3xl" aria-hidden>{item.icon}</span>
            <h2 className="mt-3 text-sm font-bold text-navy">{item.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="font-bold">
          <Link href="/calculator">{d.about.calcBtn}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/contact">{d.about.contactBtn}</Link>
        </Button>
      </div>
    </div>
  );
}
