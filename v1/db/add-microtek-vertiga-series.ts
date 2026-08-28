import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { products } from "./schema";

/**
 * Add/update the Microtek Vertiga Solar IPS/UPS Inverter series under the
 * solar-inverter category. Prices form an even ৳3,000 ladder across models
 * (owner asked for a flat +৳3,000/unit raise on the original set).
 * Specs sourced from owner-provided model sheet + BDStall listings. The
 * cover image is an owner-provided live URL (host allowlisted in
 * next.config.ts). Idempotent — safe to re-run.
 */

type Row = typeof products.$inferInsert;

const COMMON_DESC =
  "The Microtek Vertiga series features a revolutionary vertical wall-mount design that blends seamlessly with modern interiors while saving valuable floor space. Engineered with pure sine wave technology, it ensures noiseless operation and total safety for sensitive electronics like computers and smart TVs. Its built-in solar charge controller helps reduce electricity bills by intelligently prioritizing solar power for battery charging.";

// Shared live cover image (owner-provided URL, allowlisted in next.config.ts).
const IMAGE_URL = "https://solarhousebd.com/wp-content/uploads/2026/07/Gemini_Generated_Image_3o9j2t3o9j2t3o9j.png";

const SERIES: Row[] = [
  {
    name: "Microtek Vertiga 750 Solar IPS/UPS Inverter",
    nameBn: "মাইক্রোটেক ভার্টিগা 750 সোলার IPS/UPS ইনভার্টার",
    category: "solar-inverter",
    slug: "microtek-vertiga-750-solar-ips-ups-inverter",
    brand: "Microtek",
    model: "Vertiga 750VA",
    description: `${COMMON_DESC} The entry-level Vertiga 750 is ideal for 2–3 ceiling fans, 4–5 LED lights, a Wi-Fi router and mobile charging.`,
    specs: {
      Capacity: "650VA (~520W)",
      Model: "Microtek Vertiga 750",
      Type: "Solar IPS / UPS",
      "Output Waveform": "Pure Sine Wave",
      "System Voltage": "12V DC (Single Battery)",
      "Solar Technology": "PWM Solar Charge Controller",
      "Max Solar Panel Support": "~400W–500W (Voc < 25V)",
      Display: "Digital LCD (Mains, Solar, Battery & Overload Status)",
      Design: "Vertical Wall-Mount",
      Protection: "Overload, Short-Circuit & Auto-Reset",
      "Country of Origin": "India",
    },
    features: [
      "Capacity: 650VA / 520W",
      "Waveform: Pure Sine",
      "Battery: 12V Single",
      "Controller: PWM",
      "Solar Panel: up to 500W",
      "Display: Digital LCD",
      "Design: Wall-Mount",
      "Protection: Overload",
    ],
    highlights: [
      "Vertical Wall-Mount Design",
      "Smart Solar Priority — Cuts Bills",
      "Runs 2–3 Fans + Lights + Router",
    ],
    price: "18000.00",
    discountPct: 0,
    warrantyMonths: 0,
    stock: 10,
    imageUrl: IMAGE_URL,
    // Reference market price seen at BDStall.
    costPrice: { perPiece: 10500 },
    sourceUrl: "https://www.bdstall.com/details/microtek-vertiga-750-solar-inverter-ips-166312/",
  },
  {
    name: "Microtek Vertiga 1050 Solar IPS/UPS Inverter",
    nameBn: "মাইক্রোটেক ভার্টিগা 1050 সোলার IPS/UPS ইনভার্টার",
    category: "solar-inverter",
    slug: "microtek-vertiga-1050-solar-ips-ups-inverter",
    brand: "Microtek",
    model: "Vertiga 1050VA",
    description: `${COMMON_DESC} With high surge handling, the Vertiga 1050 runs a desktop PC alongside standard home loads — 3–4 fans, 5–7 LED lights, a 32"–43" LED TV and a Wi-Fi router.`,
    specs: {
      Capacity: "1050VA (~760W, rated ~900–950VA)",
      Model: "Microtek Vertiga 1050",
      Type: "Solar IPS / UPS",
      "Output Waveform": "Pure Sine Wave",
      "System Voltage": "12V DC (Single Battery)",
      "Solar Technology": "PWM Solar Charge Controller",
      "Max Solar Panel Support": "~600W (Voc < 25V)",
      Display: "Digital LCD (Mains On, UPS On, Charging, Overload, Low Battery)",
      "Charging Algorithm": "Intelligent 5-Stage PWM with ATM (Automatic Trickle Mode)",
      "Battery Compatibility": "Tubular, Flat Plate & SMF",
      Efficiency: ">80%",
      "Output Voltage (UPS Mode)": "210V+ AC",
      Frequency: "50Hz",
      "Operating Temperature": "0°C – 45°C",
      Design: "Vertical Wall-Mount",
      Protection: "Overload, Short-Circuit & Auto-Reset",
      "Country of Origin": "India",
    },
    features: [
      "Capacity: 1050VA / 760W",
      "Waveform: Pure Sine",
      "Battery: 12V Single",
      "Controller: PWM",
      "Solar Panel: up to 600W",
      "Display: Digital LCD",
      "Design: Wall-Mount",
      "Surge: PC Ready",
    ],
    highlights: [
      "Vertical Wall-Mount Design",
      "High Surge Handling — PC Ready",
      "Runs 3–4 Fans + TV + Router",
    ],
    price: "21000.00",
    discountPct: 0,
    warrantyMonths: 0,
    stock: 10,
    imageUrl: IMAGE_URL,
    images: null,
    // Reference market price seen at BDStall.
    costPrice: { perPiece: 11500 },
    sourceUrl: "https://www.bdstall.com/details/microtek-vertiga-1050-solar-inverter-ips-163695/",
  },
  {
    name: "Microtek Vertiga 1250 Solar IPS/UPS Inverter",
    nameBn: "মাইক্রোটেক ভার্টিগা 1250 সোলার IPS/UPS ইনভার্টার",
    category: "solar-inverter",
    slug: "microtek-vertiga-1250-solar-ips-ups-inverter",
    brand: "Microtek",
    model: "Vertiga 1250VA",
    description: `${COMMON_DESC} The mid-range Vertiga 1250 handles heavier setups — multiple laptops, 4–5 fans, 8–10 lights, a large 55"+ TV and a CCTV system — with extended backup.`,
    specs: {
      Capacity: "1125VA (~880W)",
      Model: "Microtek Vertiga 1250",
      Type: "Solar IPS / UPS",
      "Output Waveform": "Pure Sine Wave",
      "System Voltage": "12V DC (Single Battery)",
      "Solar Technology": "Smart MPPT / High-Efficiency PWM (varies by sub-model version)",
      "Max Solar Panel Support": "~800W–1000W",
      Display: "Multi-Color LCD",
      Design: "Vertical Wall-Mount",
      "Country of Origin": "India",
    },
    features: [
      "Capacity: 1125VA / 880W",
      "Waveform: Pure Sine",
      "Battery: 12V Single",
      "Controller: MPPT",
      "Solar Panel: 800–1000W",
      "Display: Multi-Color LCD",
      "Design: Wall-Mount",
      "Boost: +30% Power",
    ],
    highlights: [
      "MPPT — Up to 30% More Solar Power",
      "Extended Backup on Heavier Loads",
      "Runs 4–5 Fans + Large TV + CCTV",
    ],
    price: "24000.00",
    discountPct: 0,
    warrantyMonths: 0,
    stock: 10,
    imageUrl: IMAGE_URL,
  },
  {
    name: "Microtek Vertiga 1550 Solar IPS/UPS Inverter",
    nameBn: "মাইক্রোটেক ভার্টিগা 1550 সোলার IPS/UPS ইনভার্টার",
    category: "solar-inverter",
    slug: "microtek-vertiga-1550-solar-ips-ups-inverter",
    brand: "Microtek",
    model: "Vertiga 1550VA",
    description: `${COMMON_DESC} The flagship Vertiga 1550 delivers the highest capacity available on a 12V single-battery system — running energy-efficient fridges, mixer grinders (short duration), full home lighting and multiple fans & TVs without the cost of a 24V two-battery setup.`,
    specs: {
      Capacity: "1250VA–1450VA (~1000W–1100W)",
      Model: "Microtek Vertiga 1550 (Heavy Duty Series Chassis)",
      Type: "Solar IPS / UPS",
      "Output Waveform": "Pure Sine Wave",
      "System Voltage": "12V DC (Single Battery)",
      "Solar Technology": "Smart Solar Management Unit (Integrated MPPT/PWM)",
      "Max Solar Panel Support": "~1000W–1200W",
      Display: "Advanced Digital LCD",
      Design: "Vertical Wall-Mount (Heavy Duty Series)",
      Protection: "Short-Circuit, Deep Discharge, Overload & Reverse Polarity",
      "Country of Origin": "India",
    },
    features: [
      "Capacity: 1250–1450VA",
      "Waveform: Pure Sine",
      "Battery: 12V Single",
      "Solar Tech: Smart MPPT/PWM",
      "Solar Panel: 1000–1200W",
      "Display: Advanced LCD",
      "Chassis: Heavy-Duty",
      "Protection: 4-Way",
    ],
    highlights: [
      "Highest 12V Capacity — Single Battery",
      "Heavy-Duty Load Support",
      "Solar-Ready up to 1200W Panels",
    ],
    price: "27000.00",
    discountPct: 0,
    warrantyMonths: 0,
    stock: 10,
    imageUrl: IMAGE_URL,
    // Reference street price seen from local sellers (TM Electronic).
    costPrice: { perPiece: 12900 },
  },
];

async function main() {
  for (const row of SERIES) {
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, row.slug))
      .limit(1);

    if (existing.length > 0) {
      await db.update(products).set(row).where(eq(products.id, existing[0].id));
      console.log(`UPDATED ${row.slug}`);
    } else {
      await db.insert(products).values(row);
      console.log(`INSERTED ${row.slug}`);
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
