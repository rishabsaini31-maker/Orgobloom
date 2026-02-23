import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { orders } from "./orders";

export const shipments = pgTable("shipments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  // Shipping Provider Info
  carrier: text("carrier").notNull(), // e.g., "Delhivery", "BlueDart", "DTDC", "India Post"
  carrierCode: text("carrier_code"), // Short code for API integration
  trackingNumber: text("tracking_number").notNull(),
  trackingUrl: text("tracking_url"),

  // Shipment Status
  status: text("status").notNull().default("PENDING"), // PENDING, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED, RETURNED

  // Shipping Address (snapshot at time of shipping)
  shippingAddress: jsonb("shipping_address").notNull().$type<{
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  }>(),

  // Tracking Events
  trackingEvents: jsonb("tracking_events").$type<TrackingEvent[]>().default([]),

  // Estimated & Actual Dates
  estimatedDelivery: timestamp("estimated_delivery"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),

  // Shipping Cost
  shippingCost: text("shipping_cost").default("0"),
  codAmount: text("cod_amount"), // Cash on Delivery amount if applicable

  // Weight & Dimensions
  weight: text("weight"), // in kg
  dimensions: text("dimensions"), // L x W x H in cm

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TrackingEvent = {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
  statusCode?: string;
};

export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;

// Shipment status constants
export const SHIPMENT_STATUSES = {
  PENDING: "PENDING",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  RETURNED: "RETURNED",
  CANCELLED: "CANCELLED",
} as const;

export type ShipmentStatus = typeof SHIPMENT_STATUSES[keyof typeof SHIPMENT_STATUSES];