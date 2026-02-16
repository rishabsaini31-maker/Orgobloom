import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const roleEnum = pgEnum("role", ["CUSTOMER", "ADMIN"]);
export const fraudStatusEnum = pgEnum("fraud_status", [
  "SAFE",
  "MEDIUM_RISK",
  "HIGH_RISK",
]);

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull().unique(),
    name: text("name"),
    password: text("password"),
    phone: text("phone"),
    image: text("image"),

    // OAuth fields
    provider: text("provider").default("email"),
    providerAccountId: text("provider_account_id"),
    emailVerified: timestamp("email_verified"),

    // Account management
    role: roleEnum("role").default("CUSTOMER").notNull(),
    isBlocked: boolean("is_blocked").default(false).notNull(),
    blockedAt: timestamp("blocked_at"),
    blockedReason: text("blocked_reason"),

    // Fraud detection fields
    riskScore: integer("risk_score").default(0).notNull(),
    fraudStatus: fraudStatusEnum("fraud_status").default("SAFE").notNull(),
    codEnabled: boolean("cod_enabled").default(true).notNull(),
    lastIPAddress: text("last_ip_address"),
    deviceFingerprint: text("device_fingerprint"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    fraudStatusIdx: index("idx_users_fraud_status").on(table.fraudStatus),
    riskScoreIdx: index("idx_users_risk_score").on(table.riskScore),
    deviceFingerprintIdx: index("idx_users_device_fingerprint").on(
      table.deviceFingerprint,
    ),
    lastIpIdx: index("idx_users_last_ip").on(table.lastIPAddress),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
