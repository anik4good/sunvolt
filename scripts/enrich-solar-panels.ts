/**
 * One-off: fill solar panel products with verified manufacturer datasheet
 * specs + features (top 8, ordered by importance).
 *
 * Sources:
 * - JA Solar JAM72D40-620/LB (DeepBlue 4.0 Pro) datasheet
 * - Jinko JKM620N-66HL4M-BDV (Tiger Neo) datasheet
 * - REC REC400AA Pure datasheet
 * LONGi 220W and Genetic 150W left untouched (no official data / already complete).
 */
import { db } from "../db";
import { products } from "../db/schema";
import { eq } from "drizzle-orm";

const updates: Array<{
  slug: string;
  model: string;
  specs: Record<string, string>;
  features: string[];
  warrantyMonths?: number;
}> = [
  {
    slug: "ja-solar-620w-solar-panel",
    model: "JAM72D40-620/LB",
    specs: {
      "Rated Power": "620W",
      "Module Efficiency": "~22.2%",
      "Cell Type": "N-Type Mono Crystalline",
      "Number of Cells": "144 Half-Cut",
      "Open Circuit Voltage (Voc)": "53.20V",
      "Maximum Power Voltage (Vmp)": "44.44V",
      "Short Circuit Current (Isc)": "14.65A",
      "Maximum Power Current (Imp)": "13.95A",
      "Maximum System Voltage": "1500V DC",
      "Temperature Coefficient (Pmax)": "-0.29%/°C",
      "Front Glass": "2.0mm + 2.0mm Tempered Dual Glass",
      "Dimensions": "2333 × 1134 × 30 mm",
      "Weight": "32.5 kg",
      "Product Warranty": "12 Years",
      "Performance Warranty": "30 Years",
    },
    features: [
      "620W High Power Output",
      "~22.2% Module Efficiency",
      "N-Type Mono Crystalline Cells",
      "Bifacial Dual-Glass Design",
      "12-Year Product & 30-Year Performance Warranty",
      "5400Pa Snow / 2400Pa Wind Load Resistance",
      "Excellent Low-Light Performance",
      "1500V Max System Voltage",
    ],
  },
  {
    slug: "jinko-solar-620w-solar-panel",
    model: "JKM620N-66HL4M-BDV",
    specs: {
      "Rated Power": "620W",
      "Module Efficiency": "22.95%",
      "Cell Type": "N-Type TOPCon",
      "Number of Cells": "132 Half-Cut (2×66)",
      "Open Circuit Voltage (Voc)": "49.08V",
      "Maximum Power Voltage (Vmp)": "40.74V",
      "Short Circuit Current (Isc)": "16.08A",
      "Maximum Power Current (Imp)": "15.22A",
      "Maximum System Voltage": "1500V DC",
      "Front Glass": "2.0mm Anti-Reflection Coated Dual Glass",
      "Dimensions": "2382 × 1134 × 30 mm",
      "Weight": "33.4 kg",
      "Connector": "MC4 Compatible",
      "Product Warranty": "12 Years",
      "Performance Warranty": "30 Years",
    },
    features: [
      "620W High Power Output",
      "22.95% Module Efficiency",
      "N-Type TOPCon Cell Technology",
      "12-Year Product & 30-Year Performance Warranty",
      "Bifacial Dual-Glass Design",
      "132 Half-Cut Cells",
      "1500V Max System Voltage",
      "5400Pa Snow Load Resistance",
    ],
  },
  {
    slug: "rec-400w-solar-panel",
    model: "REC400AA Pure",
    specs: {
      "Rated Power": "400W",
      "Module Efficiency": "21.7%",
      "Solar Technology": "Heterojunction (HJT)",
      "Number of Cells": "132 Half-Cut",
      "Open Circuit Voltage (Voc)": "48.8V",
      "Maximum Power Voltage (Vmp)": "42.06V",
      "Short Circuit Current (Isc)": "10.25A",
      "Maximum Power Current (Imp)": "9.51A",
      "Dimensions": "1821 × 1016 × 30 mm",
      "Weight": "20.4 kg",
      "Product Warranty": "25 Years",
      "Performance Warranty": "25 Years",
    },
    features: [
      "400W Rated Power",
      "132 Half-Cut HJT Cells",
      "21.7% Module Efficiency",
      "No Light-Induced Degradation (LID)",
      "Lead-Free & RoHS Compliant Design",
      "Gapless Twin Cell Layout",
      "25-Year Product & Performance Warranty",
      "Enhanced Low-Light Performance",
    ],
    warrantyMonths: 300,
  },
];

(async () => {
  for (const { slug, ...values } of updates) {
    const result = await db
      .update(products)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(products.slug, slug))
      .returning({ id: products.id, name: products.name });
    console.log(`Updated: ${result[0]?.name ?? slug} (${result.length} row)`);
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
