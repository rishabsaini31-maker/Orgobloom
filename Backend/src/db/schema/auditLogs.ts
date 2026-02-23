import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, BULK_UPDATE, BULK_DELETE
  entityType: varchar("entity_type", { length: 50 }).notNull(), // PRODUCT, ORDER, CUSTOMER, REVIEW, etc.
  entityId: uuid("entity_id"),
  entityName: varchar("entity_name", { length: 255 }),
  description: text("description").notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
