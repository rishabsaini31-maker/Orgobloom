import { Router, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { orders, orderItems, users } from "../db/schema/index.js";
import { eq, and } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { orderLimiter } from "../middleware/rateLimiter.js";
import { sendEmail } from "../utils/emailService.js";
import { emailTemplates } from "../templates/emailTemplates.js";
import {
  createOrderTransaction,
  getUserOrdersWithItems,
} from "../services/orderService.js";

const router = Router();

function logOrderEvent(
  level: "info" | "error",
  event: string,
  data: Record<string, unknown>,
) {
  const entry = {
    level,
    event,
    at: new Date().toISOString(),
    ...data,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
    return;
  }

  console.log(JSON.stringify(entry));
}

// Create order (with rate limiting)
router.post(
  "/",
  authenticate,
  orderLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const requestId = res.locals.requestId as string;

      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      const {
        items,
        address,
        paymentMethod,
        subtotal,
        tax,
        deliveryCharge,
        total,
      } = req.body;

      logOrderEvent("info", "order.create.request_received", {
        requestId,
        userId,
        itemCount: Array.isArray(items) ? items.length : 0,
        paymentMethod,
      });

      // Validate required fields
      if (!items || items.length === 0) {
        throw new ApiError("Order must contain at least one item", 400);
      }

      if (!address) {
        throw new ApiError("Shipping address is required", 400);
      }

      // Generate order number
      const orderNumber = `ORG-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Store address as JSON string
      const shippingAddressJSON = JSON.stringify(address);

      // Create order with transaction (atomicity guaranteed)
      const {
        order: createdOrder,
        items: createdItems,
        user: orderUser,
      } = await createOrderTransaction({
        orderNumber,
        userId,
        subtotal: subtotal || 0,
        shippingCost: deliveryCharge || 0,
        tax: tax || 0,
        total: total || 0,
        shippingAddress: shippingAddressJSON,
        paymentMethod,
        items,
      });

      // Prepare order items for email
      const orderItemsForEmail = items.map((item: any) => ({
        name: item.productName || `Product ${item.productId}`,
        quantity: item.quantity,
        price: item.price,
      }));

      // Send order confirmation email to customer
      if (orderUser?.email) {
        const orderConfirmationContent = emailTemplates.orderConfirmationEmail(
          orderUser.name || "User",
          createdOrder.orderNumber,
          orderItemsForEmail,
          createdOrder.total,
          "5-7 business days",
        );
        sendEmail({
          to: orderUser.email,
          subject: orderConfirmationContent.subject,
          html: orderConfirmationContent.html,
          text: orderConfirmationContent.text,
        }).catch((err) =>
          console.error("Order confirmation email failed:", err),
        );
      }

      // Send admin notification email
      const adminEmail = process.env.ADMIN_EMAIL || "orgobloom5033@gmail.com";
      const adminNotificationContent = emailTemplates.adminNotificationEmail(
        "Admin",
        `New Order: ${createdOrder.orderNumber}`,
        `New order placed by ${orderUser?.name || orderUser?.email}\n\nOrder Details:\n- Order Number: ${createdOrder.orderNumber}\n- Total: $${createdOrder.total}\n- Items: ${items.length}\n- Status: ${createdOrder.status}\n\nPlease review in the admin panel.`,
      );
      sendEmail({
        to: adminEmail,
        subject: adminNotificationContent.subject,
        html: adminNotificationContent.html,
        text: adminNotificationContent.text,
      }).catch((err) => console.error("Admin notification email failed:", err));

      logOrderEvent("info", "order.create.success", {
        requestId,
        userId,
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        total: createdOrder.total,
      });

      res.status(201).json({
        success: true,
        order: {
          id: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          status: createdOrder.status,
          total: createdOrder.total,
          createdAt: createdOrder.createdAt,
        },
      });
    } catch (error) {
      logOrderEvent("error", "order.create.failed", {
        requestId: (res.locals.requestId as string) || "unknown",
        userId: req.user?.id || "unknown",
        message: error instanceof Error ? error.message : "unknown_error",
      });
      next(error);
    }
  },
);

// Get user orders
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      // Use optimized batch query service
      const ordersWithItems = await getUserOrdersWithItems(userId);

      res.json({
        orders: ordersWithItems,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get order details
router.get(
  "/:orderId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const orderId = req.params.orderId;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      const orderItemsList = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      res.json({
        order: {
          ...order,
          shippingAddress: JSON.parse(order.shippingAddress),
          items: orderItemsList.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: `Product ${item.productId}`,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Update order status (for future use - not exposed to frontend)
router.patch(
  "/:orderId/status",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const orderId = req.params.orderId;
      const { status } = req.body;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({ status: status as any, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning();

      res.json({ order: updatedOrder });
    } catch (error) {
      next(error);
    }
  },
);

// Cancel order
router.post(
  "/:orderId/cancel",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const orderId = req.params.orderId;
      const { reason } = req.body;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      if (
        order.status === "SHIPPED" ||
        order.status === "DELIVERED" ||
        order.status === "CANCELLED"
      ) {
        throw new ApiError(
          "Cannot cancel order with current status: " + order.status,
          400,
        );
      }

      const [cancelledOrder] = await db
        .update(orders)
        .set({
          status: "CANCELLED" as const,
          cancelReason: reason,
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      res.json({
        success: true,
        order: cancelledOrder,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
