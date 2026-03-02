import { db } from "../db/index.js";
import { orders, orderItems, users } from "../db/schema/index.js";
import { eq, inArray } from "drizzle-orm";

/**
 * Create order with transaction - ensures atomicity
 * All operations succeed or all fail; prevents partial data
 */
export async function createOrderTransaction(payload: {
  orderNumber: string;
  userId: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: string;
  paymentMethod: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    weight?: string;
  }>;
}) {
  return await db.transaction(async (tx) => {
    // Step 1: Create the order
    const [createdOrder] = await tx
      .insert(orders)
      .values({
        orderNumber: payload.orderNumber,
        userId: payload.userId,
        subtotal: payload.subtotal,
        shippingCost: payload.shippingCost,
        tax: payload.tax,
        total: payload.total,
        shippingAddress: payload.shippingAddress,
        status:
          payload.paymentMethod === "cod"
            ? ("CONFIRMED" as const)
            : ("PENDING" as const),
        paymentStatus: "PENDING",
      })
      .returning();

    if (!createdOrder) {
      throw new Error("Failed to create order");
    }

    // Step 2: Create order items
    const orderItemsData = payload.items.map((item) => ({
      orderId: createdOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      weight: item.weight || "1",
    }));

    const createdItems = await tx
      .insert(orderItems)
      .values(orderItemsData)
      .returning();

    if (!createdItems || createdItems.length === 0) {
      throw new Error("Failed to create order items");
    }

    // Step 3: Fetch user details (for email sending outside transaction)
    const [orderUser] = await tx
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    return {
      order: createdOrder,
      items: createdItems,
      user: orderUser,
    };
  });
}

/**
 * Get user orders with items - optimized batch query
 */
export async function getUserOrdersWithItems(userId: string) {
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

  if (userOrders.length === 0) {
    return [];
  }

  // Batch fetch all items for all orders in one query
  const allItems = await db
    .select()
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        userOrders.map((o) => o.id),
      ),
    );

  // Group items by order ID
  const itemsByOrderId = new Map<string, typeof allItems>();
  allItems.forEach((item) => {
    if (!itemsByOrderId.has(item.orderId)) {
      itemsByOrderId.set(item.orderId, []);
    }
    itemsByOrderId.get(item.orderId)!.push(item);
  });

  // Map orders with their item counts
  return userOrders.map((order) => ({
    ...order,
    items: itemsByOrderId.get(order.id)?.length || 0,
  }));
}
