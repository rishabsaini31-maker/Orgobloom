import { Router, Request, Response, NextFunction } from "express";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "@/middleware/auth.js";
import { ApiError } from "@/middleware/errorHandler.js";
import Stripe from "stripe";

const router = Router();

// Lazy initialization of Stripe to avoid startup errors when credentials are not configured
let stripeInstance: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new ApiError(
        "Stripe credentials not configured. Please set STRIPE_SECRET_KEY environment variable.",
        503,
      );
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
  }
  return stripeInstance;
};

// Create Stripe Payment Intent
router.post(
  "/create-payment-intent",
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

      // Verify order belongs to user
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      if (order.userId !== userId) {
        throw new ApiError("Unauthorized", 403);
      }

      // Create Stripe payment intent
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          orderId,
          userId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Store payment record
      await db.insert(payments).values({
        orderId,
        stripePaymentIntentId: paymentIntent.id,
        amount: amount.toString(),
        status: "PENDING",
        method: "STRIPE",
      });

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Stripe payment intent creation error:", error);
      next(error);
    }
  },
);

// Confirm Payment
router.post(
  "/confirm",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { paymentIntentId, orderId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      // Retrieve payment intent from Stripe
      const paymentIntent =
        await getStripe().paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        throw new ApiError("Payment not completed", 400);
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

      // Update payment record
      await db
        .update(payments)
        .set({
          status: "COMPLETED",
          stripePaymentIntentId: paymentIntentId,
          updatedAt: new Date(),
        })
        .where(eq(payments.orderId, orderId));

      res.json({
        success: true,
        message: "Payment confirmed successfully",
        order: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Create Stripe Checkout Session
router.post(
  "/create-checkout-session",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId, amount, productName } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      // Verify order belongs to user
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      if (order.userId !== userId) {
        throw new ApiError("Unauthorized", 403);
      }

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      // Create Stripe checkout session
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: productName || `Order #${order.orderNumber}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${frontendUrl}/orders/${orderId}?payment=success`,
        cancel_url: `${frontendUrl}/orders/${orderId}?payment=cancelled`,
        metadata: {
          orderId,
          userId,
        },
      });

      // Store payment record
      await db.insert(payments).values({
        orderId,
        stripePaymentIntentId: session.id,
        amount: amount.toString(),
        status: "PENDING",
        method: "STRIPE",
      });

      res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error("Stripe checkout session creation error:", error);
      next(error);
    }
  },
);

// Webhook for Stripe events
router.post(
  "/webhook",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

      let event: Stripe.Event;

      try {
        // Verify webhook signature
        event = getStripe().webhooks.constructEvent(
          req.body,
          sig,
          webhookSecret,
        );
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle different events
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const orderId = paymentIntent.metadata.orderId;

          if (orderId) {
            // Update order status
            await db
              .update(orders)
              .set({
                paymentStatus: "COMPLETED",
                status: "CONFIRMED",
                updatedAt: new Date(),
              })
              .where(eq(orders.id, orderId));

            // Update payment status
            await db
              .update(payments)
              .set({
                status: "COMPLETED",
                updatedAt: new Date(),
              })
              .where(eq(payments.stripePaymentIntentId, paymentIntent.id));
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const orderId = paymentIntent.metadata.orderId;

          if (orderId) {
            // Update order payment status
            await db
              .update(orders)
              .set({
                paymentStatus: "FAILED",
                updatedAt: new Date(),
              })
              .where(eq(orders.id, orderId));

            // Update payment status
            await db
              .update(payments)
              .set({
                status: "FAILED",
                updatedAt: new Date(),
              })
              .where(eq(payments.stripePaymentIntentId, paymentIntent.id));
          }
          break;
        }

        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const orderId = session.metadata?.orderId;

          if (orderId) {
            // Update order status
            await db
              .update(orders)
              .set({
                paymentStatus: "COMPLETED",
                status: "CONFIRMED",
                updatedAt: new Date(),
              })
              .where(eq(orders.id, orderId));

            // Update payment status
            await db
              .update(payments)
              .set({
                status: "COMPLETED",
                updatedAt: new Date(),
              })
              .where(eq(payments.stripePaymentIntentId, session.id));
          }
          break;
        }

        case "charge.refunded": {
          const charge = event.data.object as Stripe.Charge;
          const paymentIntentId = charge.payment_intent as string;

          if (paymentIntentId) {
            // Find payment by Stripe payment intent ID
            const [payment] = await db
              .select()
              .from(payments)
              .where(eq(payments.stripePaymentIntentId, paymentIntentId))
              .limit(1);

            if (payment) {
              // Update payment status
              await db
                .update(payments)
                .set({
                  status: "REFUNDED",
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
            }
          }
          break;
        }

        default:
          console.log(`Unhandled Stripe event: ${event.type}`);
      }

      res.json({ received: true });
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
      const { paymentIntentId, amount, reason } = req.body;

      // Create refund
      const refund = await getStripe().refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason:
          reason === "requested_by_customer"
            ? "requested_by_customer"
            : "requested_by_customer",
        metadata: {
          reason: reason || "Customer requested refund",
        },
      });

      res.json({
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
