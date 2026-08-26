import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "installed",
  "completed",
  "cancelled",
]);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // Bengali display name (falls back to `name` when empty)
  nameBn: text("name_bn"),
  // 'package' = complete backup package (calculator-recommendable),
  // anything else = standalone component/accessory (e.g. 'mppt-charger')
  category: text("category").notNull().default("package"),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  brand: text("brand"),
  model: text("model"),
  // Key-value spec sheet shown on component detail pages
  specs: jsonb("specs").$type<Record<string, string>>(),
  features: jsonb("features").$type<string[]>(),
  // Package-specific fields (null for components)
  batteryVoltage: numeric("battery_voltage", { precision: 5, scale: 1 }),
  batteryCapacityAh: integer("battery_capacity_ah"),
  batteryType: text("battery_type"),
  solarPanelWatt: integer("solar_panel_watt"),
  controllerWatt: integer("controller_watt"),
  backupHours: integer("backup_hours"),
  recommendedLoadWatt: integer("recommended_load_watt"),
  // Marketing example load shown on cards ("চালাতে পারবেন")
  exampleFanCount: integer("example_fan_count"),
  exampleLightCount: integer("example_light_count"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  discountPct: integer("discount_pct").notNull().default(0),
  installationPrice: numeric("installation_price", { precision: 10, scale: 2 }),
  warrantyMonths: integer("warranty_months").notNull().default(6),
  stock: integer("stock").notNull().default(0),
  // Cover image (also used by cards, cart and the calculator).
  imageUrl: text("image_url"),
  // Additional gallery images shown on the product detail page;
  // the cover is NOT repeated here.
  images: jsonb("images").$type<string[]>(),
  // Marketing bullets shown right after the price on the product page
  highlights: jsonb("highlights").$type<string[]>(),
  // "Packaging and delivery" table (unit size, weight, selling units…)
  packaging: jsonb("packaging").$type<Record<string, string>>(),
  // Supplier buying price (Alibaba ladder) for dashboard margin calc
  costPrice: jsonb("cost_price").$type<{
    moq: number;
    currency: string;
    ladder: Array<{ qtyMin: number; qtyMax: number | null; priceUsd: number }>;
  }>(),
  // Source listing URL (e.g. the Alibaba product page)
  sourceUrl: text("source_url"),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const appliances = pgTable("appliances", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").notNull().default("general"),
  defaultWatt: integer("default_watt").notNull(),
  icon: text("icon").notNull().default("🔌"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  district: text("district").notNull(),
  productId: uuid("product_id").references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
  totalLoad: integer("total_load"),
  backupHours: integer("backup_hours"),
  requiredEnergy: integer("required_energy"),
  installationRequired: boolean("installation_required")
    .notNull()
    .default(false),
  notes: text("notes"),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// One order can contain multiple packages (e-commerce cart flow).
// Name and price are snapshotted so later product edits don't rewrite
// historical orders.
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
});

// `applianceId` is null for custom devices added in the calculator;
// in that case `name` holds the customer-entered device name.
export const orderAppliances = pgTable("order_appliances", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  applianceId: uuid("appliance_id").references(() => appliances.id),
  name: text("name"),
  quantity: integer("quantity").notNull(),
  watt: integer("watt").notNull(),
  totalWatt: integer("total_watt").notNull(),
});

// Manually-created invoices for sales taken outside the website
// (phone / walk-in orders). Website orders generate invoices on the
// fly from order data and are never stored here, so every row in
// this table was issued from the admin invoice generator.
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Sequential business number, e.g. INV-0007
  invoiceNo: text("invoice_no").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  district: text("district"),
  paymentTerms: text("payment_terms"),
  salesPerson: text("sales_person"),
  notes: text("notes"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  // Preserves the admin's line-item order on the printed invoice
  position: integer("position").notNull().default(0),
});

// Singleton row (id = 1) holding all business-configurable values.
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  businessName: text("business_name").notNull().default("SunVolt"),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  address: text("address").notNull().default(""),
  currency: text("currency").notNull().default("৳"),
  batteryEfficiency: numeric("battery_efficiency", {
    precision: 4,
    scale: 3,
  })
    .notNull()
    .default("0.900"),
  systemEfficiency: numeric("system_efficiency", { precision: 4, scale: 3 })
    .notNull()
    .default("0.900"),
  recommendedReserve: numeric("recommended_reserve", {
    precision: 4,
    scale: 3,
  })
    .notNull()
    .default("0.100"),
  // Custom-sizing inputs (calculator "custom system" spec)
  systemVoltage: numeric("system_voltage", { precision: 5, scale: 1 })
    .notNull()
    .default("12.6"),
  /** Real-world panel output fraction of nameplate (0.700 = 70%). */
  panelOutputFactor: numeric("panel_output_factor", { precision: 4, scale: 3 })
    .notNull()
    .default("0.700"),
  /** Daily peak sun hours used for recharge sizing (Bangladesh ≈ 4.5). */
  peakSunHours: numeric("peak_sun_hours", { precision: 4, scale: 2 })
    .notNull()
    .default("4.50"),
  /** Comma-separated standard battery sizes in Ah. */
  batterySizes: text("battery_sizes").notNull().default("15,30,45,60,80,100,150,200"),
  /** Comma-separated standard controller ratings in W. */
  controllerSizes: text("controller_sizes").notNull().default("100,150,300,400,600"),
  /** USD→BDT rate used to convert supplier cost for margin display. */
  usdToBdt: numeric("usd_to_bdt", { precision: 8, scale: 2 })
    .notNull()
    .default("122.00"),
  /** Show the cost & margin column in the admin product list. */
  showMargin: boolean("show_margin").notNull().default(false),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Appliance = typeof appliances.$inferSelect;
export type NewAppliance = typeof appliances.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderAppliance = typeof orderAppliances.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type Settings = typeof settings.$inferSelect;
