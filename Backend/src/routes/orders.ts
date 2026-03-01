import { Router, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { orders, orderItems, addresses, users } from "../db/schema/index.js";
import { eq, and } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { createId } from "@paralleldrive/cuid2";
import { sendEmail } from "../utils/emailService.js";
import { emailTemplates } from "../templates/emailTemplates.js";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../utils/redis.js";

// Helper to get consistent client IP even behind proxy
function getClientIP(req: any): string {
  // Check X-Forwarded-For first (for proxy scenarios)
  const forwardedFor = req.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip: string) => ip.trim());
    return ips[0] || "unknown";
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

// Cache for Redis stores - created lazily on first use
const storeCache = new Map<string, RedisStore | null>();

// Helper to get or create Redis store with proper sendCommand
// Returns undefined if Redis isn't available, falling back to memory store
function getRedisStore(prefix: string) {
  // Return cached store if available
  if (storeCache.has(prefix)) {
    return storeCache.get(prefix) || undefined;
  }

  try {
    // Check if Redis is connected
    if (!redisClient.isReady) {
      console.warn(`⚠️  Redis not ready for ${prefix}, using memory store`);
      storeCache.set(prefix, null);
      return undefined; // Fallback to memory store
    }

    const store = new RedisStore({
      // @ts-expect-error - Redis store types mismatch
      client: redisClient,
      prefix: prefix,
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    });

    console.log(`✅ Created Redis store for ${prefix}`);
    storeCache.set(prefix, store);
    return store;
  } catch (error) {
    console.warn(`⚠️  Redis store failed for ${prefix}:`, error);
    storeCache.set(prefix, null);
    return undefined; // Fallback to memory store
  }
}

// Define orderLimiter locally to avoid import issues
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 orders per hour per IP
  message: {
    error: "Too many orders",
    message: "Please try again after 1 hour",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore("rl:orders:"),
  keyGenerator: (req, res) => {
    const ip = getClientIP(req);
    console.log(`[RATE LIMIT DEBUG] Order attempt from IP: ${ip}`);
    return ip;
  },
  handler: (req, res) => {
    const ip = getClientIP(req);
    console.log(
      `[RATE LIMIT] ❌ Order blocked for IP: ${ip} - Too many attempts`,
    );
    res.status(429).json({
      error: "Too many orders",
      message: "Please try again after 1 hour",
      retryAfter: "1 hour",
    });
  },
});

const router = Router();

// Create order (with rate limiting)
router.post(
  "/",
  authenticate,
  orderLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
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

      // Create order
      const [createdOrder] = await db
        .insert(orders)
        .values({
          orderNumber,
          userId,
          subtotal: subtotal || 0,
          shippingCost: deliveryCharge || 0,
          tax: tax || 0,
          total: total || 0,
          shippingAddress: shippingAddressJSON,
          status:
            paymentMethod === "cod"
              ? ("CONFIRMED" as const)
              : ("PENDING" as const),
          paymentStatus: "PENDING",
        })
        .returning();

      // Create order items
      const orderItemsData = items.map((item: any) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        weight: item.weight?.toString() || "1",
      }));

      await db.insert(orderItems).values(orderItemsData);

      // Fetch user details for email
      const [orderUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

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
        await sendEmail({
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
      await sendEmail({
        to: adminEmail,
        subject: adminNotificationContent.subject,
        html: adminNotificationContent.html,
        text: adminNotificationContent.text,
      }).catch((err) => console.error("Admin notification email failed:", err));

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

      const userOrders = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          total: orders.total,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
          shippingAddress: orders.shippingAddress,
        })
        .from(orders)
        .where(eq(orders.userId, userId));

      // Get items for each order
      const ordersWithItems = await Promise.all(
        userOrders.map(async (order: (typeof userOrders)[0]) => {
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));

          return {
            ...order,
            items: items.length,
            itemsList: items,
          };
        }),
      );

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
          items: orderItemsList,
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
