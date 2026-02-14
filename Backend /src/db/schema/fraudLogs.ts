import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

// Fraud event types
export const fraudEventTypeEnum = pgEnum("fraud_event_type", [
  "LOGIN",
  "ORDER_PLACED",
  "PAYMENT_FAILED",
  "RETURN_REQUESTED",
  "COD_REJECTED",
  "HIGH_VELOCITY_LOGIN",
  "HIGH_VELOCITY_ORDER",
]);

/**
 * FraudLogs Table
 * Tracks all fraud-related events for audit, analysis, and risk calculation
 * Indexed for scalability and TTL for data retention
 */
export const fraudLogs = pgTable(
  "fraud_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Event classification
    eventType: fraudEventTypeEnum("event_type").notNull(),

    // Risk assessment
    riskPoints: integer("risk_points").notNull(),
    reason: text("reason").notNull(),

    // Additional data for analysis
    metadata: jsonb("metadata").default({}),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_fraud_logs_user_id").on(table.userId),
    eventTypeIdx: index("idx_fraud_logs_event_type").on(table.eventType),
    createdAtIdx: index("idx_fraud_logs_created_at").on(table.createdAt),
    userCreatedIdx: index("idx_fraud_logs_user_created").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export type FraudLog = typeof fraudLogs.$inferSelect;
export type NewFraudLog = typeof fraudLogs.$inferInsert;
