import type { Metadata } from "next";
import { CalculatorClient } from "@/components/calculator/calculator-client";
import {
  getActiveAppliances,
  getBackupPackages,
  getCalculationSettings,
  getSettings,
} from "@/lib/queries";
import { getDict } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getDict();
  return {
    title: d.calc.title,
    description: d.calc.sub,
  };
}

export default async function CalculatorPage() {
  const [{ lang, d }, settings, calcSettings, appliances, products] = await Promise.all([
    getDict(),
    getSettings(),
    getCalculationSettings(),
    getActiveAppliances(),
    getBackupPackages(),
  ]);

  // Pass lean, serializable data to the client component. Only backup
  // packages reach the calculator — components are never recommended.
  return (
    <CalculatorClient
      currency={settings.currency}
      calcSettings={calcSettings}
      whatsapp={settings.whatsapp}
      phone={settings.phone}
      lang={lang}
      d={d}
      appliances={appliances.map((a) => ({
        id: a.id,
        name: a.name,
        defaultWatt: a.defaultWatt,
        icon: a.icon,
        category: a.category,
      }))}
      packages={products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        batteryVoltage: Number(p.batteryVoltage ?? 0),
        batteryCapacityAh: p.batteryCapacityAh ?? 0,
        batteryType: p.batteryType ?? "",
        solarPanelWatt: p.solarPanelWatt,
        controllerWatt: p.controllerWatt,
        backupHours: p.backupHours ?? 0,
        recommendedLoadWatt: p.recommendedLoadWatt ?? 0,
        price: p.price,
        featured: p.featured,
        active: p.active,
      }))}
    />
  );
}
