import { Router, Request, Response, NextFunction } from "express";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "@/middleware/auth";
import { ApiError } from "@/middleware/errorHandler";

const router = Router();

// PayPal API base URL (sandbox or live)
const getPayPalBaseUrl = (): string => {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
};

// Get PayPal access token
const getPayPalAccessToken = async (): Promise<string> => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new ApiError(
      "PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.",
      503,
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal auth error:", error);
    throw new ApiError("Failed to authenticate with PayPal", 500);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
};

// Create PayPal Order
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

      const accessToken = await getPayPalAccessToken();
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      // Create PayPal order
      const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: orderId,
              description: `Order #${order.orderNumber}`,
              amount: {
                currency_code: "USD",
                value: amount.toFixed(2),
              },
            },
          ],
          application_context: {
            return_url: `${frontendUrl}/orders/${orderId}?payment=success`,
            cancel_url: `${frontendUrl}/orders/${orderId}?payment=cancelled`,
            brand_name: "Orgobloom",
            user_action: "PAY_NOW",
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("PayPal order creation error:", error);
        throw new ApiError("Failed to create PayPal order", 500);
      }

      const paypalOrder = (await response.json()) as {
        id: string;
        links: Array<{ rel: string; href: string }>;
      };

      // Store payment record
      await db.insert(payments).values({
        orderId,
        paypalOrderId: paypalOrder.id,
        amount: amount.toString(),
        status: "PENDING",
        method: "PAYPAL",
      });

      // Find the approval URL
      const approvalUrl = paypalOrder.links?.find(
        (link) => link.rel === "approve",
      )?.href;

      res.json({
        success: true,
        orderId: paypalOrder.id,
        approvalUrl,
      });
    } catch (error) {
      console.error("PayPal order creation error:", error);
      next(error);
    }
  },
);

// Capture PayPal Payment
router.post(
  "/capture",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { paypalOrderId, orderId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      const accessToken = await getPayPalAccessToken();

      // Capture the payment
      const response = await fetch(
        `${getPayPalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("PayPal capture error:", error);
        throw new ApiError("Failed to capture PayPal payment", 500);
      }

      const captureResult = (await response.json()) as {
        status: string;
        purchase_units: Array<{
          payments: {
            captures: Array<{ id: string }>;
          };
        }>;
      };

      if (captureResult.status !== "COMPLETED") {
        throw new ApiError("Payment not completed", 400);
      }

      // Get capture ID from the response
      const captureId =
        captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id;

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
          paypalCaptureId: captureId,
          updatedAt: new Date(),
        })
        .where(eq(payments.paypalOrderId, paypalOrderId));

      res.json({
        success: true,
        message: "Payment captured successfully",
        order: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Webhook for PayPal events
router.post(
  "/webhook",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = req.body;

      console.log(`Received PayPal webhook: ${event.event_type}`);

      // Verify webhook signature in production
      // For now, we'll process the event

      switch (event.event_type) {
        case "PAYMENT.CAPTURE.COMPLETED": {
          const capture = event.resource;
          const paypalOrderId =
            capture.supplementary_data?.related_ids?.order_id;

          if (paypalOrderId) {
            // Find payment by PayPal order ID
            const [payment] = await db
              .select()
              .from(payments)
              .where(eq(payments.paypalOrderId, paypalOrderId))
              .limit(1);

            if (payment) {
              // Update order status
              await db
                .update(orders)
                .set({
                  paymentStatus: "COMPLETED",
                  status: "CONFIRMED",
                  updatedAt: new Date(),
                })
                .where(eq(orders.id, payment.orderId));

              // Update payment status
              await db
                .update(payments)
                .set({
                  status: "COMPLETED",
                  paypalCaptureId: capture.id,
                  updatedAt: new Date(),
                })
                .where(eq(payments.id, payment.id));
            }
          }
          break;
        }

        case "PAYMENT.CAPTURE.DENIED":
        case "PAYMENT.CAPTURE.REFUNDED": {
          const capture = event.resource;
          const captureId = capture.id;

          if (captureId) {
            // Find payment by capture ID
            const [payment] = await db
              .select()
              .from(payments)
              .where(eq(payments.paypalCaptureId, captureId))
              .limit(1);

            if (payment) {
              const isRefund = event.event_type === "PAYMENT.CAPTURE.REFUNDED";

              // Update payment status
              await db
                .update(payments)
                .set({
                  status: isRefund ? "REFUNDED" : "FAILED",
                  refundStatus: isRefund ? "COMPLETED" : undefined,
                  updatedAt: new Date(),
                })
                .where(eq(payments.id, payment.id));

              // Update order status
              await db
                .update(orders)
                .set({
                  paymentStatus: isRefund ? "REFUNDED" : "FAILED",
                  status: isRefund ? "CANCELLED" : undefined,
                  updatedAt: new Date(),
                })
                .where(eq(orders.id, payment.orderId));
            }
          }
          break;
        }

        case "CHECKOUT.ORDER.APPROVED": {
          // Order approved by buyer, waiting for capture
          console.log(`PayPal order approved: ${event.resource.id}`);
          break;
        }

        default:
          console.log(`Unhandled PayPal event: ${event.event_type}`);
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  },
);

// Refund PayPal Payment
router.post(
  "/refund",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { captureId, amount, reason } = req.body;

      const accessToken = await getPayPalAccessToken();

      // Create refund request
      const refundBody: any = {};
      if (amount) {
        refundBody.amount = {
          value: amount.toFixed(2),
          currency_code: "USD",
        };
      }
      if (reason) {
        refundBody.note_to_payer = reason;
      }

      const response = await fetch(
        `${getPayPalBaseUrl()}/v2/payments/captures/${captureId}/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(refundBody),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("PayPal refund error:", error);
        throw new ApiError("Failed to refund PayPal payment", 500);
      }

      const refundResult = (await response.json()) as {
        id: string;
        status: string;
        amount?: { value: string };
      };

      // Update payment record
      await db
        .update(payments)
        .set({
          refundId: refundResult.id,
          refundStatus: refundResult.status,
          refundAmount: amount ? amount.toString() : undefined,
          refundReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(payments.paypalCaptureId, captureId));

      res.json({
        success: true,
        refund: {
          id: refundResult.id,
          status: refundResult.status,
          amount: refundResult.amount?.value,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get PayPal Order Details
router.get(
  "/order/:paypalOrderId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { paypalOrderId } = req.params;

      const accessToken = await getPayPalAccessToken();

      const response = await fetch(
        `${getPayPalBaseUrl()}/v2/checkout/orders/${paypalOrderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new ApiError("Failed to get PayPal order details", 500);
      }

      const orderDetails = await response.json();

      res.json({
        success: true,
        order: orderDetails,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
