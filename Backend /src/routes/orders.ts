import { Router } from "express";
import { db } from "@/db";
import { orders, orderItems, addresses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticate, AuthRequest } from "@/middleware/auth";
import { ApiError } from "@/middleware/errorHandler";
import { createId } from "@paralleldrive/cuid2";

const router = Router();

// Create order
router.post("/", authenticate, async (req: AuthRequest, res, next) => {
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
});

// Get user orders
router.get("/", authenticate, async (req: AuthRequest, res, next) => {
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
      userOrders.map(async (order: typeof userOrders[0]) => {
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
});

// Get order details
router.get("/:orderId", authenticate, async (req: AuthRequest, res, next) => {
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
});

// Update order status (for future use - not exposed to frontend)
router.patch(
  "/:orderId/status",
  authenticate,
  async (req: AuthRequest, res, next) => {
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
  async (req: AuthRequest, res, next) => {
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
