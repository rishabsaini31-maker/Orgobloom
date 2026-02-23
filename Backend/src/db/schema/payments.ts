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
  razorpayOrderId: text("razorpay_order_id").unique(),
  razorpayPaymentId: text("razorpay_payment_id").unique(),
  razorpaySignature: text("razorpay_signature"),

  // Stripe details
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeChargeId: text("stripe_charge_id"),

  // PayPal details
  paypalOrderId: text("paypal_order_id").unique(),
  paypalCaptureId: text("paypal_capture_id"),

  amount: real("amount").notNull(),
  currency: text("currency").default("INR").notNull(),
  status: paymentStatusEnum("status").default("PENDING").notNull(),

  // Additional info
  method: text("method"), // RAZORPAY, STRIPE, PAYPAL, COD
  email: text("email"),
  contact: text("contact"),

  // Refund info
  refundId: text("refund_id"),
  refundAmount: real("refund_amount"),
  refundReason: text("refund_reason"),
  refundStatus: text("refund_status"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
