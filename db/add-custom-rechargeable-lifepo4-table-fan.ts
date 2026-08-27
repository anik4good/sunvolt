import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { products } from "./schema";

/**
 * Add the Custom Rechargeable LiFePO4 Table Fan under the new `fan`
 * category (selling price ৳6,500). Built-in 12V 6Ah LiFePO4 battery with
 * 7 hours backup — owner asked that the backup time be called out (it is a
 * feature tile, a spec row, and in the description). Cover image is an
 * owner-provided live URL (safebdes.com allowlisted in next.config.ts).
 * Idempotent — safe to re-run.
 */

const ROW = {
  name: "Custom Rechargeable LiFePO4 Table Fan",
  nameBn: "কাস্টম রিচার্জেবল LiFePO4 টেবিল ফ্যান",
  category: "fan",
  slug: "custom-rechargeable-lifepo4-table-fan",
  description:
    "The Custom Rechargeable LiFePO4 Table Fan is a 12-inch DC table fan with a built-in 12V 6Ah LiFePO4 battery that runs up to 7 hours on a single charge. Multi-speed selection and an oscillation system let you set the airflow just right, while the efficient 12W DC motor delivers 10 m³/min of air — ideal for load-shedding, study desks, shops and travel. Available in Green, Ivory and Maroon.",
  specs: {
    Type: "Rechargeable Table Fan",
    Size: '12" (300mm)',
    Color: "Green, Ivory, Maroon",
    "Rated Voltage": "DC 12V",
    "Motor Type": "DC 12V",
    Speed: "1700 RPM",
    "Speed Control": "Multi-Speed Selection",
    Oscillation: "Yes",
    "Input Power": "12 Watt",
    Current: "1 Ampere",
    "Air Delivery": "10 m³/min",
    "Service Value": "0.84 m³/min/watt",
    Battery: "12V 6Ah LiFePO4 (Built-in)",
    "Backup Time": "7 Hours",
    "Body Carton Dimension": "L-355mm × W-215mm × H-340mm",
  } satisfies Record<string, string>,
  features: [
    "Size: 12\" / 300mm",
    "Battery: 12V 6Ah LiFePO4",
    "Backup: 7 Hours",
    "Motor: DC 12V",
    "Speed: 1700 RPM",
    "Power: 12 Watt",
    "Air Flow: 10 m³/min",
    "Speeds: Multi-Speed",
    "Oscillation: Yes",
    "Colors: 3 Options",
  ] satisfies string[],
  price: "6500.00",
  discountPct: 0,
  warrantyMonths: 0,
  stock: 10,
  imageUrl: "https://safebdes.com/image/cache/catalog/safe/fan/safe-fan/sstf-1112-500x500.jpg",
  images: null,
} satisfies typeof products.$inferInsert;

async function main() {
  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, ROW.slug))
    .limit(1);

  if (existing.length > 0) {
    await db.update(products).set(ROW).where(eq(products.id, existing[0].id));
    console.log(`UPDATED ${ROW.slug}`);
  } else {
    await db.insert(products).values(ROW);
    console.log(`INSERTED ${ROW.slug}`);
  }

  const saved = await db
    .select({ id: products.id, name: products.name, price: products.price, category: products.category })
    .from(products)
    .where(eq(products.slug, ROW.slug))
    .limit(1);
  console.log("Saved:", JSON.stringify(saved[0]));
  process.exit(0);
}

main().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
