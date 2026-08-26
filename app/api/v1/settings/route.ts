import { type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSettings } from "@/lib/queries";
import { formatPanelRates, type PanelRate } from "@/lib/panel-rates";
import { json, parseBody, revalidateSite, withApiKey } from "@/lib/api";

export const dynamic = "force-dynamic";

const settingsUpdateSchema = z
  .object({
    businessName: z.string().trim().min(1).max(80),
    phone: z.string().trim().min(6).max(20),
    whatsapp: z
      .string()
      .trim()
      .regex(/^\d{10,15}$/, "WhatsApp must be digits in international format, e.g. 8801601744070"),
    address: z.string().trim().max(250),
    currency: z.string().trim().min(1).max(8),
    batteryEfficiency: z.number().min(0.1).max(1),
    systemEfficiency: z.number().min(0.1).max(1),
    recommendedReserve: z.number().min(0).max(1),
    systemVoltage: z.number().min(1).max(1000),
    panelOutputFactor: z.number().min(0.1).max(1),
    peakSunHours: z.number().min(1).max(12),
    batterySizes: z.array(z.number().int().min(1).max(10000)).min(1).max(30),
    controllerSizes: z.array(z.number().int().min(1).max(100000)).min(1).max(30),
    usdToBdt: z.number().min(1).max(1000),
    showMargin: z.boolean(),
    panelRates: z
      .array(
        z.object({
          volt: z.number().int().min(1).max(1000),
          perWatt: z.number().min(0.01).max(100000),
        }),
      )
      .max(10)
      .superRefine((rates, ctx) => {
        const volts = rates.map((r) => r.volt);
        if (new Set(volts).size !== volts.length) {
          ctx.addIssue({ code: "custom", message: "Each voltage may only appear once." });
        }
      }),
  })
  .partial();

function serializeSettings(s: Awaited<ReturnType<typeof getSettings>>) {
  return {
    businessName: s.businessName,
    phone: s.phone,
    whatsapp: s.whatsapp,
    address: s.address,
    currency: s.currency,
    batteryEfficiency: Number(s.batteryEfficiency),
    systemEfficiency: Number(s.systemEfficiency),
    recommendedReserve: Number(s.recommendedReserve),
    systemVoltage: Number(s.systemVoltage),
    panelOutputFactor: Number(s.panelOutputFactor),
    peakSunHours: Number(s.peakSunHours),
    batterySizes: s.batterySizes.split(",").map(Number),
    controllerSizes: s.controllerSizes.split(",").map(Number),
    usdToBdt: Number(s.usdToBdt),
    showMargin: s.showMargin,
    panelRates: [] as PanelRate[],
  };
}

/** GET /api/v1/settings — the settings singleton, API-friendly shape. */
export const GET = withApiKey(async () => {
  const s = await getSettings();
  return json({ ...serializeSettings(s), panelRates: parseRates(s.panelRates) });
});

function parseRates(value: string): PanelRate[] {
  return (value ?? "")
    .split(",")
    .map((part) => {
      const [volt, perWatt] = part.split(":");
      return { volt: Number(volt), perWatt: Number(perWatt) };
    })
    .filter((r) => Number.isFinite(r.volt) && r.volt > 0 && Number.isFinite(r.perWatt) && r.perWatt > 0)
    .sort((a, b) => a.volt - b.volt);
}

/** PATCH /api/v1/settings — partial update; sizes normalize + sort. */
export const PATCH = withApiKey(async (request: NextRequest) => {
  const parsed = await parseBody(request, settingsUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  // Merge with current values so a partial PATCH keeps valid state.
  const current = await getSettings();

  const values: Partial<typeof settings.$inferInsert> = {};
  if (data.businessName !== undefined) values.businessName = data.businessName;
  if (data.phone !== undefined) values.phone = data.phone;
  if (data.whatsapp !== undefined) values.whatsapp = data.whatsapp;
  if (data.address !== undefined) values.address = data.address;
  if (data.currency !== undefined) values.currency = data.currency;
  if (data.batteryEfficiency !== undefined) values.batteryEfficiency = data.batteryEfficiency.toFixed(3);
  if (data.systemEfficiency !== undefined) values.systemEfficiency = data.systemEfficiency.toFixed(3);
  if (data.recommendedReserve !== undefined) values.recommendedReserve = data.recommendedReserve.toFixed(3);
  if (data.systemVoltage !== undefined) values.systemVoltage = data.systemVoltage.toFixed(1);
  if (data.panelOutputFactor !== undefined) values.panelOutputFactor = data.panelOutputFactor.toFixed(3);
  if (data.peakSunHours !== undefined) values.peakSunHours = data.peakSunHours.toFixed(2);
  if (data.batterySizes !== undefined) {
    values.batterySizes = [...new Set(data.batterySizes)].sort((a, b) => a - b).join(",");
  }
  if (data.controllerSizes !== undefined) {
    values.controllerSizes = [...new Set(data.controllerSizes)].sort((a, b) => a - b).join(",");
  }
  if (data.usdToBdt !== undefined) values.usdToBdt = data.usdToBdt.toFixed(2);
  if (data.showMargin !== undefined) values.showMargin = data.showMargin;
  if (data.panelRates !== undefined) values.panelRates = formatPanelRates(data.panelRates);

  if (Object.keys(values).length === 0) {
    return json({ ...serializeSettings(current), panelRates: parseRates(current.panelRates) });
  }

  await db.update(settings).set(values).where(eq(settings.id, 1));
  revalidateSite();

  const updated = await getSettings();
  return json({ ...serializeSettings(updated), panelRates: parseRates(updated.panelRates) });
});
