import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { categories, products } from "./schema";

/**
 * Add the SENMA PV1500DC-AL photovoltaic DC solar cables (4mm² and 6mm²)
 * under the new `cable` category. Prices are per goj (yard, 0.9144 m) for
 * a red & black pair — owner-set: 4mm² ৳180/goj, 6mm² ৳230/goj. Specs from
 * the owner-provided listing sheet. No images / cost price / warranty were
 * provided (warranty stays 0 = badge hidden). Idempotent — safe to re-run.
 */

type Row = typeof products.$inferInsert;

// Built-in default lives in lib/categories.ts (appended after `fan`,
// sortOrder = array index). Ensure the DB row exists without clobbering
// any admin edits if it was already created manually.
async function ensureCableCategory() {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, "cable"))
    .limit(1);

  if (existing.length > 0) {
    console.log("SKIPPED category cable (already present)");
    return;
  }
  await db.insert(categories).values({
    slug: "cable",
    label: "Cable",
    labelBn: "ক্যাবল",
    icon: "🔗",
    sortOrder: 10,
  });
  console.log("INSERTED category cable");
}

const CABLES: Row[] = [
  {
    name: "Solar Cable 6mm PV1500DC-AL Photovoltaic DC Solar Cable, Aluminum Alloy Photovoltaic Wire",
    nameBn: "সোলার ক্যাবল ৬মিমি PV1500DC-AL ফটোভোলটাইক ডিসি সোলার তার (অ্যালুমিনিয়াম অ্যালয়)",
    category: "cable",
    slug: "solar-cable-6mm-pv1500dc-al",
    brand: "SENMA",
    model: "PV1500DC-AL-K",
    description:
      "<p>SENMA PV1500DC-AL 6mm² single-core photovoltaic DC solar cable for power-station wiring. Aluminum alloy conductor with double XLPO insulation and jacket, rated 0.6/1 kV (test DC 1.8 kV) and stable from -40°C to +90°C. Sold per goj (yard) as a red &amp; black pair for positive and negative runs.</p>",
    specs: {
      "Model Number": "PV1500DC-AL-K (1×6.0 mm²)",
      Brand: "SENMA",
      "Cable Size": "1×6.0 mm²",
      Type: "Low Voltage PV DC Cable",
      "Conductor Material": "Aluminum Alloy",
      "Insulation Material": "XLPO",
      Jacket: "XLPO",
      "Rated Voltage": "0.6 kV / 1 kV",
      "Test Voltage": "AC: 0.6/1 kV, DC: 1.8 kV",
      "Rated Current": "40 A",
      "Ambient Temperature": "-40°C ~ +90°C",
      "Min. Bending Radius": "5D",
      Colours: "Black & Red",
      Application: "Power Station",
      "Place of Origin": "Hebei, China",
      "Sold As": "Red & Black pair",
      "Selling Unit": "Goj (yard, 0.9144 m)",
    },
    features: [
      "Size: 6mm² (1×6.0)",
      "Conductor: Aluminum Alloy",
      "Insulation: XLPO",
      "Rated Voltage: 0.6/1 kV",
      "Rated Current: 40 A",
      "Temperature: -40°C~+90°C",
      "Colours: Red & Black",
      "Sold Per: Goj (yard)",
    ],
    highlights: [
      "Double XLPO Insulation & Jacket",
      "Red & Black Pair — Sold Per Goj",
      "-40°C to +90°C, 5D Bend Radius",
    ],
    packaging: {
      "Selling Unit": "Goj (yard, 0.9144 m)",
      "Sold As": "1 red + 1 black cable (pair)",
    },
    price: "230.00",
    discountPct: 0,
    warrantyMonths: 0,
    stock: 10,
  },
  {
    name: "Solar Cable 4mm PV1500DC-AL Photovoltaic DC Solar Cable, Aluminum Alloy Photovoltaic Wire",
    nameBn: "সোলার ক্যাবল ৪মিমি PV1500DC-AL ফটোভোলটাইক ডিসি সোলার তার (অ্যালুমিনিয়াম অ্যালয়)",
    category: "cable",
    slug: "solar-cable-4mm-pv1500dc-al",
    brand: "SENMA",
    model: "PV1500DC-AL-K",
    description:
      "<p>SENMA PV1500DC-AL 4mm² single-core photovoltaic DC solar cable for power-station wiring. Aluminum alloy conductor with double XLPO insulation and jacket, rated 0.6/1 kV (test DC 1.8 kV) and stable from -40°C to +90°C. Sold per goj (yard) as a red &amp; black pair for positive and negative runs.</p>",
    specs: {
      "Model Number": "PV1500DC-AL-K (1×4.0 mm²)",
      Brand: "SENMA",
      "Cable Size": "1×4.0 mm²",
      Type: "Low Voltage PV DC Cable",
      "Conductor Material": "Aluminum Alloy",
      "Insulation Material": "XLPO",
      Jacket: "XLPO",
      "Rated Voltage": "0.6 kV / 1 kV",
      "Test Voltage": "AC: 0.6/1 kV, DC: 1.8 kV",
      "Rated Current": "30 A",
      "Ambient Temperature": "-40°C ~ +90°C",
      "Min. Bending Radius": "5D",
      Colours: "Black & Red",
      Application: "Power Station",
      "Place of Origin": "Hebei, China",
      "Sold As": "Red & Black pair",
      "Selling Unit": "Goj (yard, 0.9144 m)",
    },
    features: [
      "Size: 4mm² (1×4.0)",
      "Conductor: Aluminum Alloy",
      "Insulation: XLPO",
      "Rated Voltage: 0.6/1 kV",
      "Rated Current: 30 A",
      "Temperature: -40°C~+90°C",
      "Colours: Red & Black",
      "Sold Per: Goj (yard)",
    ],
    highlights: [
      "Double XLPO Insulation & Jacket",
      "Red & Black Pair — Sold Per Goj",
      "-40°C to +90°C, 5D Bend Radius",
    ],
    packaging: {
      "Selling Unit": "Goj (yard, 0.9144 m)",
      "Sold As": "1 red + 1 black cable (pair)",
    },
    price: "180.00",
    discountPct: 0,
    warrantyMonths: 0,
    stock: 10,
  },
];

async function main() {
  await ensureCableCategory();

  for (const row of CABLES) {
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
