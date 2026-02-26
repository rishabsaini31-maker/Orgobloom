import { Router, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { orders, payments, users } from "../db/schema/index.js";
import { eq, and, desc } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { createId } from "@paralleldrive/cuid2";
import Razorpay from "razorpay";
import {
  sendToUser,
  sendToAdmins,
  NotificationType,
  createNotification,
} from "../utils/notifications.js";
import { sendEmail } from "../utils/emailService.js";
import { emailTemplates } from "../templates/emailTemplates.js";

const router = Router();

// Refund status enum
enum RefundStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  FAILED = "FAILED",
}

// Lazy initialization of payment gateways
const getRazorpay = (): Razorpay => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new ApiError("Razorpay credentials not configured", 503);
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const getStripe = async () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new ApiError("Stripe credentials not configured", 503);
  }
  // Dynamic import for Stripe - will fail if stripe package not installed
  try {
    const Stripe = require("stripe");
    return new Stripe(secretKey, { apiVersion: "2023-10-16" });
  } catch {
    throw new ApiError("Stripe package not installed", 503);
  }
};

// User: Create refund request
router.post(
  "/request",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new ApiError("User not authenticated", 401);

      const { orderId, reason, amount, type } = req.body;

      if (!orderId || !reason) {
        throw new ApiError("Order ID and reason are required", 400);
      }

      // Get order details
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
        .limit(1);

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      // Check if order is eligible for refund
      if (order.status === "CANCELLED") {
        throw new ApiError("Order is already cancelled", 400);
      }

      if (order.paymentStatus !== "COMPLETED") {
        throw new ApiError("Order payment is not completed", 400);
      }

      // Get payment details
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1);

      if (!payment) {
        throw new ApiError("Payment not found for this order", 404);
      }

      // Check if refund already exists
      if (payment.refundStatus && payment.refundStatus !== "REJECTED") {
        throw new ApiError("Refund request already exists for this order", 400);
      }

      const refundAmount = amount || payment.amount;
      const refundId = `REFUND-${createId()}`;

      // Update payment with refund request
      await db
        .update(payments)
        .set({
          refundId,
          refundAmount,
          refundReason: reason,
          refundStatus: RefundStatus.PENDING,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      // Notify admins about refund request
      sendToAdmins({
        id: createId(),
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "New Refund Request",
        message: `Refund request for order ${order.orderNumber}: ${reason}`,
        data: { orderId, refundId, amount: refundAmount },
        createdAt: new Date(),
        read: false,
      });

      // Send email to user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: `Refund Request Submitted - ${order.orderNumber}`,
          html: `
            <h2>Refund Request Received</h2>
            <p>Dear ${user.name || "Customer"},</p>
            <p>Your refund request for order <strong>${order.orderNumber}</strong> has been submitted.</p>
            <p><strong>Refund Amount:</strong> ₹${refundAmount}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>We will review your request and get back to you within 2-3 business days.</p>
          `,
          text: `Refund request submitted for order ${order.orderNumber}. Amount: ₹${refundAmount}. We will review and respond within 2-3 business days.`,
        }).catch((err) => console.error("Refund email failed:", err));
      }

      res.status(201).json({
        success: true,
        message: "Refund request submitted successfully",
        refund: {
          id: refundId,
          orderId,
          amount: refundAmount,
          status: RefundStatus.PENDING,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Admin: Get all refund requests
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { status, page = "1", limit = "20" } = req.query;

      let refundPayments;
      if (status) {
        refundPayments = await db
          .select()
          .from(payments)
          .where(eq(payments.refundStatus, status as string))
          .orderBy(desc(payments.updatedAt))
          .limit(parseInt(limit as string))
          .offset((parseInt(page as string) - 1) * parseInt(limit as string));
      } else {
        refundPayments = await db
          .select()
          .from(payments)
          .where(eq(payments.refundStatus, RefundStatus.PENDING))
          .orderBy(desc(payments.updatedAt))
          .limit(parseInt(limit as string))
          .offset((parseInt(page as string) - 1) * parseInt(limit as string));
      }

      // Get order details for each refund
      const refundsWithOrders = await Promise.all(
        refundPayments.map(async (payment) => {
          const [order] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, payment.orderId))
            .limit(1);

          const [user] = order
            ? await db
                .select()
                .from(users)
                .where(eq(users.id, order.userId))
                .limit(1)
            : [null];

          return {
            ...payment,
            order,
            user: user
              ? { id: user.id, name: user.name, email: user.email }
              : null,
          };
        }),
      );

      res.json({
        refunds: refundsWithOrders,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Admin: Approve refund request
router.post(
  "/:refundId/approve",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { refundId } = req.params;
      const { amount, notes } = req.body;

      // Find payment by refund ID
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.refundId, refundId))
        .limit(1);

      if (!payment) {
        throw new ApiError("Refund request not found", 404);
      }

      if (payment.refundStatus !== RefundStatus.PENDING) {
        throw new ApiError("Refund is not in pending status", 400);
      }

      const refundAmount = amount || payment.refundAmount || payment.amount;

      // Update status to processing
      await db
        .update(payments)
        .set({
          refundStatus: RefundStatus.PROCESSING,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      let refundResult: any = null;

      // Process refund based on payment method
      try {
        if (payment.method === "RAZORPAY" && payment.razorpayPaymentId) {
          const razorpay = getRazorpay();
          refundResult = await razorpay.payments.refund(
            payment.razorpayPaymentId,
            {
              amount: Math.round(refundAmount * 100), // Convert to paise
              notes: {
                reason: payment.refundReason || "",
                adminNotes: notes || "",
              },
            },
          );
        } else if (
          payment.method === "STRIPE" &&
          payment.stripePaymentIntentId
        ) {
          const stripe = await getStripe();
          refundResult = await stripe.refunds.create({
            payment_intent: payment.stripePaymentIntentId,
            amount: Math.round(refundAmount * 100), // Convert to cents
            reason: "requested_by_customer",
            metadata: {
              reason: payment.refundReason || "",
              notes: notes || "",
            },
          });
        } else {
          throw new ApiError("No valid payment method found for refund", 400);
        }

        // Update payment with refund completion
        await db
          .update(payments)
          .set({
            refundStatus: RefundStatus.COMPLETED,
            refundAmount: refundAmount,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        // Update order status
        await db
          .update(orders)
          .set({
            paymentStatus: "REFUNDED",
            status: "CANCELLED",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, payment.orderId));

        // Get order and user for notification
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, payment.orderId))
          .limit(1);

        if (order?.userId) {
          sendToUser(order.userId, {
            id: createId(),
            type: NotificationType.ORDER_CANCELLED,
            title: "Refund Processed",
            message: `Your refund of ₹${refundAmount} for order ${order.orderNumber} has been processed.`,
            data: { orderId: order.id, refundId, amount: refundAmount },
            createdAt: new Date(),
            read: false,
          });

          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, order.userId))
            .limit(1);

          if (user?.email) {
            await sendEmail({
              to: user.email,
              subject: `Refund Processed - ${order.orderNumber}`,
              html: `
                <h2>Refund Processed Successfully</h2>
                <p>Dear ${user.name || "Customer"},</p>
                <p>Your refund for order <strong>${order.orderNumber}</strong> has been processed.</p>
                <p><strong>Refund Amount:</strong> ₹${refundAmount}</p>
                <p>The amount will be credited to your original payment method within 5-7 business days.</p>
              `,
              text: `Refund of ₹${refundAmount} for order ${order.orderNumber} has been processed. Amount will be credited within 5-7 business days.`,
            }).catch((err) =>
              console.error("Refund confirmation email failed:", err),
            );
          }
        }

        res.json({
          success: true,
          message: "Refund processed successfully",
          refund: {
            id: refundId,
            amount: refundAmount,
            status: RefundStatus.COMPLETED,
            gatewayResponse: refundResult,
          },
        });
      } catch (refundError: any) {
        // Update status to failed
        await db
          .update(payments)
          .set({
            refundStatus: RefundStatus.FAILED,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        throw new ApiError(
          `Refund processing failed: ${refundError.message}`,
          500,
        );
      }
    } catch (error) {
      next(error);
    }
  },
);

// Admin: Reject refund request
router.post(
  "/:refundId/reject",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { refundId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        throw new ApiError("Rejection reason is required", 400);
      }

      // Find payment by refund ID
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.refundId, refundId))
        .limit(1);

      if (!payment) {
        throw new ApiError("Refund request not found", 404);
      }

      if (payment.refundStatus !== RefundStatus.PENDING) {
        throw new ApiError("Refund is not in pending status", 400);
      }

      // Update payment with rejection
      await db
        .update(payments)
        .set({
          refundStatus: RefundStatus.REJECTED,
          refundReason: `${payment.refundReason} | Rejection reason: ${reason}`,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      // Get order and user for notification
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, payment.orderId))
        .limit(1);

      if (order?.userId) {
        sendToUser(order.userId, {
          id: createId(),
          type: NotificationType.ORDER_CANCELLED,
          title: "Refund Request Rejected",
          message: `Your refund request for order ${order.orderNumber} has been rejected. Reason: ${reason}`,
          data: { orderId: order.id, refundId, reason },
          createdAt: new Date(),
          read: false,
        });

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, order.userId))
          .limit(1);

        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: `Refund Request Update - ${order.orderNumber}`,
            html: `
              <h2>Refund Request Update</h2>
              <p>Dear ${user.name || "Customer"},</p>
              <p>We regret to inform you that your refund request for order <strong>${order.orderNumber}</strong> has been rejected.</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p>If you have any questions, please contact our support team.</p>
            `,
            text: `Your refund request for order ${order.orderNumber} has been rejected. Reason: ${reason}. Please contact support for any questions.`,
          }).catch((err) =>
            console.error("Refund rejection email failed:", err),
          );
        }
      }

      res.json({
        success: true,
        message: "Refund request rejected",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get refund status for user
router.get(
  "/status/:orderId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new ApiError("User not authenticated", 401);

      const { orderId } = req.params;

      // Verify order belongs to user
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
        .limit(1);

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      // Get payment details
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1);

      if (!payment) {
        throw new ApiError("Payment not found", 404);
      }

      res.json({
        refund: {
          id: payment.refundId,
          amount: payment.refundAmount,
          reason: payment.refundReason,
          status: payment.refundStatus,
          createdAt: payment.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
