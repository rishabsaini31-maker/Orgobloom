import {
  pgTable,
  text,
  timestamp,
  boolean,
  json,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// Webhook event types enum
export const webhookEventEnum = pgEnum("webhook_event", [
  "order.created",
  "order.updated",
  "order.cancelled",
  "order.delivered",
  "payment.captured",
  "payment.failed",
  "payment.refunded",
  "shipment.created",
  "shipment.updated",
  "shipment.delivered",
  "user.registered",
  "user.updated",
  "review.created",
  "review.updated",
  "product.low_stock",
  "product.out_of_stock",
]);

// Webhook status enum
export const webhookStatusEnum = pgEnum("webhook_status", [
  "active",
  "inactive",
  "failed",
]);

// Webhook delivery status enum
export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "success",
  "failed",
  "retrying",
]);

// Webhook endpoints table - stores webhook configurations
export const webhooks = pgTable("webhooks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  // Webhook name/identifier
  name: text("name").notNull(),

  // Target URL for webhook delivery
  url: text("url").notNull(),

  // Secret key for signature verification
  secret: text("secret").notNull(),

  // Events to trigger this webhook
  events: json("events").$type<string[]>().notNull().default([]),

  // Webhook status
  status: webhookStatusEnum("status").default("active").notNull(),

  // Optional description
  description: text("description"),

  // Headers to include in webhook requests
  headers: json("headers").$type<Record<string, string>>(),

  // Retry configuration
  retryCount: text("retry_count").default("3"),
  retryDelay: text("retry_delay").default("1000"), // milliseconds

  // Timeout for webhook requests (milliseconds)
  timeout: text("timeout").default("30000"),

  // Last delivery timestamp
  lastDeliveryAt: timestamp("last_delivery_at"),

  // Last delivery status
  lastDeliveryStatus: deliveryStatusEnum("last_delivery_status"),

  // Failure count (consecutive)
  failureCount: text("failure_count").default("0"),

  // Created by (admin user)
  createdBy: text("created_by"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Webhook deliveries table - stores delivery attempts and logs
export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  // Reference to webhook
  webhookId: text("webhook_id")
    .notNull()
    .references(() => webhooks.id, { onDelete: "cascade" }),

  // Event type that triggered this delivery
  event: webhookEventEnum("event").notNull(),

  // Delivery status
  status: deliveryStatusEnum("status").default("pending").notNull(),

  // Request payload
  payload: json("payload").$type<Record<string, any>>().notNull(),

  // Request headers sent
  requestHeaders: json("request_headers").$type<Record<string, string>>(),

  // Response status code
  responseStatusCode: text("response_status_code"),

  // Response body
  responseBody: text("response_body"),

  // Response headers
  responseHeaders: json("response_headers").$type<Record<string, string>>(),

  // Error message if failed
  errorMessage: text("error_message"),

  // Retry attempt number
  attemptNumber: text("attempt_number").default("1"),

  // Time taken for the request (milliseconds)
  duration: text("duration"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
});

// Third-party integrations table
export const integrations = pgTable("integrations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  // Integration name
  name: text("name").notNull(),

  // Integration type (razorpay, shiprocket, delhivery, etc.)
  type: text("type").notNull(),

  // Integration status
  status: webhookStatusEnum("status").default("active").notNull(),

  // API credentials (encrypted)
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  apiEndpoint: text("api_endpoint"),

  // Additional configuration
  config: json("config").$type<Record<string, any>>(),

  // Webhook URL for this integration
  webhookUrl: text("webhook_url"),

  // Webhook secret for verification
  webhookSecret: text("webhook_secret"),

  // Last sync timestamp
  lastSyncAt: timestamp("last_sync_at"),

  // Created by (admin user)
  createdBy: text("created_by"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;

// Webhook event type
export type WebhookEventType = (typeof webhookEventEnum.enumValues)[number];
export type WebhookStatusType = (typeof webhookStatusEnum.enumValues)[number];
export type DeliveryStatusType = (typeof deliveryStatusEnum.enumValues)[number];
