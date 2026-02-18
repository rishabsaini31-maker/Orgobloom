import { Router, Request, Response, NextFunction } from "express";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "@/middleware/auth";
import { ApiError } from "@/middleware/errorHandler";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// Create Razorpay Order
router.post(
  "/create-order",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId, amount } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      // Validate amount
      if (!amount || amount <= 0) {
        throw new ApiError("Invalid amount", 400);
      }

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: "INR",
        receipt: `order_${orderId}_${Date.now()}`,
        notes: {
          orderId,
          userId,
        },
      });

      res.json({
        success: true,
        order: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
        },
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Razorpay order creation error:", error);
      next(error);
    }
  },
);

// Verify Payment
router.post(
  "/verify",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId,
      } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        throw new ApiError("Invalid payment signature", 400);
      }

      // Update order payment status
      const [updatedOrder] = await db
        .update(orders)
        .set({
          paymentStatus: "COMPLETED",
          status: "CONFIRMED",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        throw new ApiError("Order not found", 404);
      }

      // Record payment
      await db.insert(payments).values({
        orderId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        amount: updatedOrder.total,
        status: "COMPLETED",
        method: "RAZORPAY",
      });

      res.json({
        success: true,
        message: "Payment verified successfully",
        order: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get Payment Details
router.get(
  "/:paymentId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { paymentId } = req.params;

      const payment = await razorpay.payments.fetch(paymentId);

      res.json({
        success: true,
        payment,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Refund Payment
router.post(
  "/refund",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { paymentId, amount, reason } = req.body;

      const refund = await razorpay.payments.refund(paymentId, {
        amount: amount ? Math.round(amount * 100) : undefined,
        notes: {
          reason: reason || "Customer requested refund",
        },
      });

      res.json({
        success: true,
        refund,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Webhook for payment events
router.post(
  "/webhook",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const webhookSignature = req.headers["x-razorpay-signature"] as string;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

      // Verify webhook signature
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (expectedSignature !== webhookSignature) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      const event = req.body.event;
      const paymentEntity = req.body.payload?.payment?.entity;

      if (!paymentEntity) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      // Handle different events
      if (event === "payment.captured") {
        // Find payment by razorpay payment id
        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.razorpayPaymentId, paymentEntity.id))
          .limit(1);

        if (payment) {
          await db
            .update(orders)
            .set({
              paymentStatus: "COMPLETED",
              status: "CONFIRMED",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, payment.orderId));

          await db
            .update(payments)
            .set({
              status: "COMPLETED",
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id));
        }
      } else if (event === "payment.failed") {
        // Find payment by razorpay payment id
        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.razorpayPaymentId, paymentEntity.id))
          .limit(1);

        if (payment) {
          await db
            .update(orders)
            .set({
              paymentStatus: "FAILED",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, payment.orderId));

          await db
            .update(payments)
            .set({
              status: "FAILED",
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id));
        }
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
