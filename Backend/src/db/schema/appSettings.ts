import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const appSettings = pgTable("app_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  appName: text("app_name").default("Orgobloom"),
  appDescription: text("app_description").default(
    "Premium organic products marketplace",
  ),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#3b82f6"),
  secondaryColor: text("secondary_color").default("#10b981"),
  accentColor: text("accent_color").default("#f59e0b"),
  emailFrom: text("email_from").default("noreply@orgobloom.com"),
  supportEmail: text("support_email").default("support@orgobloom.com"),
  currency: text("currency").default("INR"),
  timezone: text("timezone").default("Asia/Kolkata"),
  maintenanceMode: boolean("maintenance_mode").default(false),
  enableRegistration: boolean("enable_registration").default(true),
  enableGuestCheckout: boolean("enable_guest_checkout").default(true),
  maxOrderQuantity: integer("max_order_quantity").default(999),
  minOrderAmount: integer("min_order_amount").default(0),
  freeShippingThreshold: integer("free_shipping_threshold").default(500),
  shippingCost: integer("shipping_cost").default(50),
  taxRate: integer("tax_rate").default(18),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AppSettings = typeof appSettings.$inferSelect;
