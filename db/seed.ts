import "dotenv/config";
import { db } from "./index";
import { appliances, products, settings } from "./schema";

// Initial reference data from plan.md. Only inserts when a table is empty,
// so re-running the seed never overwrites admin edits.
async function seedAppliances() {
  const existing = await db.select({ id: appliances.id }).from(appliances);
  if (existing.length > 0) {
    console.log(`appliances: skipped (${existing.length} rows already present)`);
    return;
  }
  await db.insert(appliances).values([
    { name: "DC Fan", category: "cooling", defaultWatt: 17, icon: "fan" },
    { name: "DC Bulb", category: "lighting", defaultWatt: 3, icon: "bulb" },
    { name: "AC Fan", category: "ac", defaultWatt: 70, icon: "fan" },
    { name: "AC Light", category: "ac", defaultWatt: 20, icon: "bulb" },
    { name: "DC Light", category: "lighting", defaultWatt: 5, icon: "💡", active: false },
    { name: "TV", category: "entertainment", defaultWatt: 60, icon: "📺", active: false },
    { name: "WiFi Router", category: "network", defaultWatt: 10, icon: "📡", active: false },
  ]);
  console.log("appliances: inserted 5 rows");
}

async function seedProducts() {
  const existing = await db.select({ id: products.id }).from(products);
  if (existing.length > 0) {
    console.log(`products: skipped (${existing.length} rows already present)`);
    return;
  }
  await db.insert(products).values([
    {
      // Draft: price and panel/controller specs to be set by admin
      // before activating.
      name: "SunVolt 3 Hour DC",
      slug: "sunvolt-3-hour",
      exampleFanCount: 1,
      exampleLightCount: 2,
      description:
        "৩ ঘণ্টার সোলার ব্যাকআপ প্যাকেজ — লোডশেডিং চলাকালীন ফ্যান ও লাইট চালানোর জন্য।",
      batteryVoltage: "12.6",
      batteryCapacityAh: 15,
      backupHours: 3,
      recommendedLoadWatt: 39,
      price: "13500",
      solarPanelWatt: 200,
      controllerWatt: 150,
      warrantyMonths: 6,
      active: true,
      featured: false,
    },
    {
      // Draft: price and panel/controller specs to be set by admin
      // before activating.
      name: "SunVolt 6 Hour DC",
      slug: "sunvolt-6-hour",
      exampleFanCount: 2,
      exampleLightCount: 3,
      description:
        "৬ ঘণ্টার সোলার ব্যাকআপ প্যাকেজ — লোডশেডিং চলাকালীন ফ্যান ও লাইট চালানোর জন্য।",
      batteryVoltage: "12.6",
      batteryCapacityAh: 30,
      backupHours: 6,
      recommendedLoadWatt: 39,
      price: "16300",
      solarPanelWatt: 200,
      controllerWatt: 150,
      warrantyMonths: 6,
      active: true,
      featured: false,
    },
    {
      name: "SunVolt 12 Hour DC",
      slug: "sunvolt-12-hour",
      exampleFanCount: 2,
      exampleLightCount: 5,
      description:
        "১২ ঘণ্টার সোলার ব্যাকআপ প্যাকেজ — লোডশেডিং চলাকালীন ফ্যান ও লাইট চালাতে পারবেন।",
      batteryVoltage: "12.6",
      batteryCapacityAh: 45,
      batteryType: "LiFePO4",
      solarPanelWatt: 200,
      controllerWatt: 150,
      backupHours: 12,
      recommendedLoadWatt: 39,
      price: "18700",
      warrantyMonths: 6,
      stock: 0,
      active: true,
      featured: true,
    },
  ]);
  console.log("products: inserted 3 rows");
}

async function seedSettings() {
  const existing = await db.select({ id: settings.id }).from(settings);
  if (existing.length > 0) {
    console.log(`settings: skipped (${existing.length} row already present)`);
    return;
  }
  await db.insert(settings).values({
    id: 1,
    businessName: "SunVolt",
    phone: "01601744070",
    // wa.me links need the international format without a leading "+"
    whatsapp: "8801601744070",
    address: "",
    currency: "৳",
    batteryEfficiency: "0.900",
    systemEfficiency: "0.900",
    recommendedReserve: "0.100",
  });
  console.log("settings: inserted 1 row");
}

async function main() {
  console.log(`Seeding ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ":***@")}`);
  await seedAppliances();
  await seedProducts();
  await seedSettings();
  console.log("Done.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
