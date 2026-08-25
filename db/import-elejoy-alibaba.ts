import "dotenv/config";
import { readFileSync } from "fs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { products } from "./schema";

/**
 * Enrich existing ELEJOY store products with full data scraped from
 * Alibaba (data/mppt_charger_elejoy.json): highlights, complete
 * attribute table, packaging, supplier price ladder and source URL.
 * Idempotent — safe to re-run.
 */

interface LadderEntry {
  qty_min: number | null;
  qty_max: number | null;
  price_usd: number | null;
  price_local_formatted?: string;
}

interface ScrapedProduct {
  product_id: number;
  title: string;
  url: string;
  moq: number | null;
  price_ladder_usd: LadderEntry[];
  sku_attributes: Record<string, string[]>;
  specifications: Record<string, string>;
  images: string[];
  packaging?: Record<string, string>;
}

// Which scraped listing feeds which store model (best-selling listing
// picked where the factory multi-lists the same product).
const MODEL_MAP: Array<{ storeModel: string; alibabaId: number; highlights: string[] }> = [
  {
    storeModel: "EMD600W",
    alibabaId: 1600857005967, // IP65 listing, 758 sold
    highlights: [
      "600W Maximum PV Power",
      "12V/24V Adjustable Output",
      "MPPT Charging Technology",
      "LCD Display",
      "Up to 97% Conversion Efficiency",
      "CE Certified",
    ],
  },
  {
    storeModel: "EL-MD300SP",
    alibabaId: 1600819794666,
    highlights: [
      "300W Maximum PV Power",
      "12V/24V Adjustable Output",
      "MPPT Charging Technology",
      "LED Display",
      "Up to 99% Conversion Efficiency",
      "CE Certified",
    ],
  },
  {
    storeModel: "PD6501",
    alibabaId: 1601516601188, // 65W Solar Charger Type C PD Converter
    highlights: [
      "65W Maximum Output Power",
      "USB Type-C Power Delivery Output",
      "MPPT Solar Charging Technology",
      "Wide 15-60V PV Input Range",
      "Fast Charging for Laptops, Tablets & Phones",
      "CE Certified",
    ],
  },
  {
    storeModel: "EL-MD400SP",
    alibabaId: 1600857365592,
    highlights: [
      "400W Maximum PV Power",
      "12V/24V Adjustable Output",
      "MPPT Charging Technology",
      "LED Display",
      "Up to 99% Conversion Efficiency",
      "CE Certified",
    ],
  },
];

// Packaging data captured per listing (from Alibaba trade.logisticInfo)
const PACKAGING_BY_ID: Record<number, Record<string, string>> = {
  1600857005967: {
    "Selling Units": "Single item",
    "Single package size": "17.2X13.8X4.7 cm",
    "Single gross weight": "1.35 kg",
  },
};

async function main() {
  const scraped = JSON.parse(
    readFileSync("data/mppt_charger_elejoy.json", "utf-8"),
  ) as { products: ScrapedProduct[] };
  const byId = new Map(scraped.products.map((p) => [p.product_id, p]));

  for (const entry of MODEL_MAP) {
    const sp = byId.get(entry.alibabaId);
    if (!sp) {
      console.log(`SKIP ${entry.storeModel}: scraped listing ${entry.alibabaId} not found`);
      continue;
    }

    // Merge scraped SKU attrs into the attribute table (flat strings)
    const attributes: Record<string, string> = { ...sp.specifications };
    for (const [k, values] of Object.entries(sp.sku_attributes)) {
      if (values.length > 0) attributes[k] = values.join(", ");
    }
    // Display type lives in the Alibaba title (LCD/LED/OLED), not the
    // attribute table — extract it so the product page tile can show it.
    const displayMatch = /(OLED|LCD|LED)\s+DISPLAY/i.exec(sp.title);
    if (displayMatch) {
      attributes["Display"] = `${displayMatch[1].toUpperCase()} Display`;
    }

    const ladder = sp.price_ladder_usd
      .filter((l) => l.price_usd != null)
      .map((l) => ({
        qtyMin: l.qty_min ?? 0,
        qtyMax: l.qty_max ?? null,
        priceUsd: l.price_usd as number,
      }));

    const costPrice = {
      moq: sp.moq ?? ladder[0]?.qtyMin ?? 1,
      currency: "USD",
      ladder,
    };

    const packaging =
      PACKAGING_BY_ID[entry.alibabaId] ??
      (Object.keys(sp.packaging ?? {}).length > 0 ? sp.packaging! : null);

    const rows = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.model, entry.storeModel))
      .limit(1);

    if (rows.length === 0) {
      console.log(`MISS ${entry.storeModel}: no store product with this model`);
      continue;
    }

    await db
      .update(products)
      .set({
        highlights: entry.highlights,
        specs: attributes,
        packaging,
        costPrice,
        sourceUrl: sp.url,
      })
      .where(eq(products.id, rows[0].id));

    console.log(
      `OK   ${entry.storeModel}: ${entry.highlights.length} highlights, ${Object.keys(attributes).length} attributes, ${ladder.length} price tiers, cost from $${ladder[0]?.priceUsd}`,
    );
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
