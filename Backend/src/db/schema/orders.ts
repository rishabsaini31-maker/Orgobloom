import {
  pgTable,
  text,
  timestamp,
  real,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "PROCESSING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
]);

export const orders = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  orderNumber: text("order_number").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Order details
  subtotal: real("subtotal").notNull(),
  shippingCost: real("shipping_cost").default(0).notNull(),
  tax: real("tax").default(0).notNull(),
  total: real("total").notNull(),

  // Status
  status: orderStatusEnum("status").default("PENDING").notNull(),
  paymentStatus: paymentStatusEnum("payment_status")
    .default("PENDING")
    .notNull(),

  // Shipping address (JSON)
  shippingAddress: text("shipping_address").notNull(), // Store as JSON string

  // Tracking
  trackingNumber: text("tracking_number"),
  notes: text("notes"),

  // Cancellation
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),

  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  weight: text("weight").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
