import { formatPrice } from "@/lib/format";

/**
 * WhatsApp helpers (plan §29). The number lives in settings — never
 * hardcode it in components. Numbers use the international format
 * without "+" (e.g. 8801601744070).
 */

export function whatsappUrl(number: string, text: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Prefilled inquiry for a specific package (plan §29 template). */
export function packageInquiryMessage(
  product: {
    name: string;
    batteryVoltage: number;
    batteryCapacityAh: number;
    batteryType: string;
    solarPanelWatt?: number | null;
    controllerWatt?: number | null;
    price: string;
  },
  currency: string,
): string {
  const lines = [
    "Assalamu Alaikum SunVolt,",
    "",
    `I am interested in the ${product.name} Package.`,
    `Battery: ${product.batteryVoltage}V ${product.batteryCapacityAh}Ah ${product.batteryType}`,
  ];
  if (product.solarPanelWatt) {
    lines.push(`Solar Panel: ${product.solarPanelWatt}W`);
  }
  if (product.controllerWatt) {
    lines.push(`Controller: ${product.controllerWatt}W`);
  }
  lines.push(`Price: ${formatPrice(product.price, currency)}`, "", "My Name:", "My Phone:", "My Address:");
  return lines.join("\n");
}

/** Prefilled inquiry when the calculator found no suitable package (plan §19). */
export function customSystemInquiryMessage(
  totalLoadWatt: number,
  backupHours: number,
  requiredWh: number,
  spec?: { batteryAh?: number; panelWatt?: number; controllerWatt?: number },
): string {
  const lines = [
    "Assalamu Alaikum SunVolt,",
    "",
    "আমার প্রয়োজন স্ট্যান্ডার্ড প্যাকেজের চেয়ে বেশি:",
    `মোট লোড: ${totalLoadWatt}W`,
    `ব্যাকআপ: ${backupHours} ঘণ্টা`,
    `প্রয়োজনীয় শক্তি: ${requiredWh}Wh`,
  ];
  if (spec?.batteryAh || spec?.panelWatt || spec?.controllerWatt) {
    lines.push(
      "",
      "ক্যালকুলেটরের সাজেস্টেড স্পেক:",
      `ব্যাটারি: ${spec.batteryAh ?? "—"}Ah`,
      `প্যানেল: ${spec.panelWatt ?? "—"}W`,
      `কন্ট্রোলার: ${spec.controllerWatt ?? "—"}W`,
    );
  }
  lines.push("", "আমার জন্য কাস্টম সোলার সিস্টেমের একটি প্রস্তাব জানাবেন।");
  return lines.join("\n");
}

/** Prefilled message after placing an order. */
export function orderPlacedMessage(orderId: string, productName: string): string {
  return [
    "Assalamu Alaikum SunVolt,",
    "",
    `আমি একটি অর্ডার করেছি।`,
    `Order ID: ${orderId}`,
    `Package: ${productName}`,
    "",
    "অনুগ্রহ করে অর্ডারটি নিশ্চিত করুন।",
  ].join("\n");
}
