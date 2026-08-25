import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  BatteryCharging,
  Check,
  Clock,
  ShieldCheck,
  Sun,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { getCalculationSettings, getProductBySlug, getSettings } from "@/lib/queries";
import { formatPrice, toBn } from "@/lib/format";
import { packageInquiryMessage, whatsappUrl } from "@/lib/whatsapp";
import { calculateBackupTime } from "@/lib/solar";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "প্যাকেজ পাওয়া যায়নি" };
  return {
    title: `${product.name} | ${product.batteryCapacityAh ?? 0}Ah ${product.batteryType ?? ""}`,
    description: product.description ?? undefined,
  };
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  // Individual products live under /products — old links keep working.
  if (product.category !== "package") redirect(`/products/${slug}`);
  if (!product.active) notFound();

  const [settings, calcSettings] = await Promise.all([
    getSettings(),
    getCalculationSettings(),
  ]);

  const displayName = product.nameBn ?? product.name;
  const estimatedBackup = calculateBackupTime(
    product.recommendedLoadWatt ?? 0,
    product.batteryVoltage ?? 12,
    product.batteryCapacityAh ?? 0,
    calcSettings,
  );

  const specs = [
    {
      icon: <BatteryCharging className="size-5" aria-hidden />,
      label: "ব্যাটারি",
      value: `${product.batteryVoltage ?? 0}V ${product.batteryCapacityAh ?? 0}Ah ${product.batteryType ?? ""}`,
    },
    {
      icon: <Sun className="size-5" aria-hidden />,
      label: "সোলার প্যানেল",
      value: product.solarPanelWatt ? `${product.solarPanelWatt}W` : "—",
    },
    {
      icon: <Zap className="size-5" aria-hidden />,
      label: "চার্জ কন্ট্রোলার",
      value: product.controllerWatt ? `${product.controllerWatt}W` : "—",
    },
    {
      icon: <Check className="size-5" aria-hidden />,
      label: "সুপারিশকৃত লোড",
      value: `${product.recommendedLoadWatt ?? 0}W পর্যন্ত`,
    },
    {
      icon: <Clock className="size-5" aria-hidden />,
      label: "ব্যাকআপ",
      value: `প্রায় ${product.backupHours ?? 0} ঘণ্টা*`,
    },
    {
      icon: <ShieldCheck className="size-5" aria-hidden />,
      label: "ওয়ারেন্টি",
      value: `${product.warrantyMonths} মাস`,
    },
  ];

  const contents = [
    product.solarPanelWatt ? `☀️ ${product.solarPanelWatt}W Solar Panel` : null,
    product.controllerWatt
      ? `⚡ ${product.controllerWatt}W Solar Charge Controller`
      : null,
    `🔋 ${product.batteryVoltage ?? 0}V ${product.batteryCapacityAh ?? 0}Ah ${product.batteryType ?? ""} Battery`,
  ].filter((x): x is string => x !== null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/packages" className="hover:text-navy">
          প্যাকেজ
        </Link>{" "}
        / <span className="text-navy">{displayName}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="flex min-h-64 items-center justify-center rounded-3xl bg-navy p-10 text-center">
          <div>
            <span className="text-7xl" aria-hidden>🔋</span>
            <p className="mt-4 text-sm font-medium text-white/80">
              {product.batteryVoltage ?? 0}V {product.batteryCapacityAh ?? 0}Ah{" "}
              {product.batteryType ?? ""}
            </p>
          </div>
        </div>

        <div>
          {product.featured ? (
            <Badge className="bg-solar font-semibold text-navy">বেস্ট সেলার</Badge>
          ) : null}
          <h1 className="mt-2 text-3xl font-extrabold text-navy">{displayName}</h1>
          <p className="mt-1 text-lg text-muted-foreground">
            হালকা লোডে সর্বোচ্চ প্রায় {toBn(product.backupHours ?? 0)} ঘণ্টা ব্যাকআপ*
          </p>
          {product.description ? (
            <p className="mt-3 text-muted-foreground">{product.description}</p>
          ) : null}

          <p className="mt-5 text-4xl font-extrabold text-navy">
            {formatPrice(product.price, settings.currency)}
            <span className="text-base font-normal text-muted-foreground">/-</span>
          </p>
          <p className="text-sm text-muted-foreground">ইনস্টলেশন চার্জ আলাদা</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AddToCartButton
              size="lg"
              label="অর্ডার করুন"
              addedLabel="কার্টে যোগ হয়েছে"
              goToCart
              className="h-13 flex-1 text-base font-bold"
              item={{
                slug: product.slug,
                name: displayName,
                battery: `${product.batteryVoltage ?? 0}V ${product.batteryCapacityAh ?? 0}Ah ${product.batteryType ?? ""}`.trim(),
                price: Number(product.price),
              }}
            />
            <WhatsAppButton
              className="h-13 flex-1"
              href={whatsappUrl(
                settings.whatsapp,
                packageInquiryMessage(
                  {
                    name: product.name,
                    batteryVoltage: product.batteryVoltage ?? 0,
                    batteryCapacityAh: product.batteryCapacityAh ?? 0,
                    batteryType: product.batteryType ?? "",
                    solarPanelWatt: product.solarPanelWatt,
                    controllerWatt: product.controllerWatt,
                    price: product.price,
                  },
                  settings.currency,
                ),
              )}
            />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            *ব্যাকআপ সময় লোডের ধরন, ব্যবহার পদ্ধতি, ব্যাটারির অবস্থা ও
            অন্যান্য পরিস্থিতির উপর নির্ভরশীল।
          </p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-navy">স্পেসিফিকেশন</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map((spec) => (
            <Card key={spec.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-solar-light text-solar-dark">
                  {spec.icon}
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{spec.label}</p>
                  <p className="text-sm font-semibold text-navy">{spec.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-navy">প্যাকেজে যা থাকছে</h2>
        <ul className="mt-4 space-y-2 rounded-2xl border bg-card p-5">
          {contents.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm font-medium">
              <Check className="size-4 text-leaf" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-navy">টেকনিক্যাল বিবরণ</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <tbody>
              {[
                ["ব্যাটারি ভোল্টেজ", `${product.batteryVoltage ?? 0}V (DC)`],
                [
                  "ব্যাটারি ক্যাপাসিটি",
                  `${product.batteryCapacityAh ?? 0}Ah (${(product.batteryVoltage ?? 0) * (product.batteryCapacityAh ?? 0)}Wh)`,
                ],
                ["ব্যাটারি টাইপ", product.batteryType ?? "—"],
                ["সুপারিশকৃত সর্বোচ্চ লোড", `${product.recommendedLoadWatt ?? 0}W`],
                ["আনুমানিক ব্যাকআপ (সুপারিশকৃত লোডে)", `${estimatedBackup} ঘণ্টা`],
                ["ওয়ারেন্টি", `${product.warrantyMonths} মাস`],
              ].map(([label, value], i) => (
                <tr key={label} className={i % 2 === 0 ? "bg-secondary/40" : ""}>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {label}
                  </th>
                  <td className="px-4 py-3 font-semibold text-navy">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Separator className="my-10" />

      <div className="flex flex-col gap-3 rounded-2xl bg-navy p-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div>
          <h2 className="text-lg font-bold text-white">
            কোন প্যাকেজ উপযুক্ত নিশ্চিত নন?
          </h2>
          <p className="mt-1 text-sm text-white/70">
            আপনার ডিভাইস ও ব্যাকআপ সময় দিয়ে হিসাব করুন — ১ মিনিটেই।
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-solar font-bold text-navy hover:bg-solar-dark"
        >
          <Link href="/calculator">ব্যাকআপ হিসাব করুন</Link>
        </Button>
      </div>
    </div>
  );
}
