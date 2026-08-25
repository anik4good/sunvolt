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
  batteryVoltage: integer("battery_voltage"),
  batteryCapacityAh: integer("battery_capacity_ah"),
  batteryType: text("battery_type"),
  solarPanelWatt: integer("solar_panel_watt"),
  controllerWatt: integer("controller_watt"),
  backupHours: integer("backup_hours"),
  recommendedLoadWatt: integer("recommended_load_watt"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  discountPct: integer("discount_pct").notNull().default(0),
  installationPrice: numeric("installation_price", { precision: 10, scale: 2 }),
  warrantyMonths: integer("warranty_months").notNull().default(6),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
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
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Appliance = typeof appliances.$inferSelect;
export type NewAppliance = typeof appliances.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderAppliance = typeof orderAppliances.$inferSelect;
export type Settings = typeof settings.$inferSelect;
