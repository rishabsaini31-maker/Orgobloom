import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { orders, paymentStatusEnum } from "./orders";

export const payments = pgTable("payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  orderId: text("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),

  // Razorpay details
  razorpayOrderId: text("razorpay_order_id").notNull().unique(),
  razorpayPaymentId: text("razorpay_payment_id").unique(),
  razorpaySignature: text("razorpay_signature"),

  amount: real("amount").notNull(),
  currency: text("currency").default("INR").notNull(),
  status: paymentStatusEnum("status").default("PENDING").notNull(),

  // Additional info
  method: text("method"),
  email: text("email"),
  contact: text("contact"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
