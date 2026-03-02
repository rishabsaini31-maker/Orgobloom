import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  pgEnum,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { sql } from "drizzle-orm";

export const ticketStatusEnum = pgEnum("ticket_status", [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
  "WAITING_ADMIN",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
]);

export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const ticketCategoryEnum = pgEnum("ticket_category", [
  "ORDER",
  "PAYMENT",
  "DELIVERY",
  "PRODUCT_QUALITY",
  "REFUND",
  "ACCOUNT",
  "TECHNICAL",
  "GENERAL",
  "BILLING",
]);

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: ticketCategoryEnum("category").notNull().default("GENERAL"),
  priority: ticketPriorityEnum("priority").notNull().default("MEDIUM"),
  status: ticketStatusEnum("status").notNull().default("OPEN"),
  orderId: uuid("order_id"),
  assignedToAdmin: uuid("assigned_to_admin"),
  resolution: text("resolution"),
  resolutionTime: timestamp("resolution_time"),
  satisfactionRating: integer("satisfaction_rating"), // 1-5
  satisfactionNotes: text("satisfaction_notes"),
  attachmentUrls: text("attachment_urls"), // JSON array stored as text
  internalNotes: text("internal_notes"), // For admin notes
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
  closedAt: timestamp("closed_at"),
});

export const ticketReplies = pgTable("ticket_replies", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => supportTickets.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  isAdminReply: boolean("is_admin_reply").notNull().default(false),
  attachmentUrls: text("attachment_urls"), // JSON array
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});
