import type { Metadata } from "next";
import { CalculatorClient } from "@/components/calculator/calculator-client";
import {
  getActiveAppliances,
  getBackupPackages,
  getCalculationSettings,
  getSettings,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "স্মার্ট ব্যাকআপ হিসাব",
  description:
    "আপনার ডিভাইস ও ব্যাকআপ সময় নির্বাচন করুন — SunVolt হিসাব করে বলে দেবে কোন সোলার প্যাকেজ আপনার জন্য উপযুক্ত।",
};

export default async function CalculatorPage() {
  const [settings, calcSettings, appliances, products] = await Promise.all([
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
      appliances={appliances.map((a) => ({
        id: a.id,
        name: a.name,
        defaultWatt: a.defaultWatt,
        icon: a.icon,
      }))}
      packages={products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        batteryVoltage: p.batteryVoltage ?? 0,
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
