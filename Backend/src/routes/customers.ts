import { Router, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { users, orders } from "../db/schema/index.js";
import { eq, and, gte, count, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all customers with issue tracking
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        isBlocked: users.isBlocked,
        blockedReason: users.blockedReason,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "CUSTOMER"));

    // Enrich with order statistics
    const customersWithStats = await Promise.all(
      allUsers.map(async (customer: (typeof allUsers)[0]) => {
        // Get all orders for this customer
        const customerOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.userId, customer.id));

        const total = customerOrders.length;

        // Count unpicked/cancelled orders
        const unPickedCount = customerOrders.filter(
          (order: any) =>
            order.status === "CANCELLED" ||
            (order.status === "DELIVERED" && order.cancelledAt !== null),
        ).length;

        return {
          ...customer,
          totalOrders: total,
          unPickedOrders: unPickedCount,
          issueLevel:
            unPickedCount >= 3
              ? "critical"
              : unPickedCount >= 2
                ? "warning"
                : "none",
        };
      }),
    );

    res.json({
      data: customersWithStats,
      total: customersWithStats.length,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

// Get special customers (with 2+ unpicked orders)
router.get(
  "/problematic",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          isBlocked: users.isBlocked,
          blockedReason: users.blockedReason,
          blockedAt: users.blockedAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.role, "CUSTOMER"));

      // Get problematic customers
      const problematicCustomers = await Promise.all(
        allUsers.map(async (customer: (typeof allUsers)[0]) => {
          const unPickedOrders = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(orders)
            .where(
              and(
                eq(orders.userId, customer.id),
                sql`(status = 'DELIVERED' AND cancelled_at IS NOT NULL) OR status = 'CANCELLED'`,
              ),
            );

          const totalOrders = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(orders)
            .where(eq(orders.userId, customer.id));

          const unPickedCount = unPickedOrders[0]?.count || 0;
          const total = totalOrders[0]?.count || 0;

          return {
            ...customer,
            totalOrders: total,
            unPickedOrders: unPickedCount,
            issueLevel:
              unPickedCount >= 3
                ? "critical"
                : unPickedCount >= 2
                  ? "warning"
                  : "none",
          };
        }),
      ).then((customers) => customers.filter((c) => c.unPickedOrders >= 2));

      res.json({
        data: problematicCustomers,
        total: problematicCustomers.length,
      });
    } catch (error) {
      console.error("Error fetching special customers:", error);
      res.status(500).json({ message: "Failed to fetch special customers" });
    }
  },
);

// Get customer details with order history
router.get(
  "/:customerId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { customerId } = req.params;

      const customer = await db
        .select()
        .from(users)
        .where(eq(users.id, customerId));

      if (!customer.length) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Get all orders
      const customerOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, customerId));

      res.json({
        data: {
          ...customer[0],
          orders: customerOrders,
        },
      });
    } catch (error) {
      console.error("Error fetching customer details:", error);
      res.status(500).json({ message: "Failed to fetch customer details" });
    }
  },
);

// Block customer
router.post(
  "/:customerId/block",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { customerId } = req.params;
      const { reason } = req.body;

      const blockedCustomer = await db
        .update(users)
        .set({
          isBlocked: true,
          blockedAt: new Date(),
          blockedReason:
            reason ||
            "Blocked as Special Customer due to multiple unpicked orders",
          updatedAt: new Date(),
        })
        .where(eq(users.id, customerId))
        .returning();

      res.json({
        data: blockedCustomer[0],
        message: "Customer blocked successfully",
      });
    } catch (error) {
      console.error("Error blocking customer:", error);
      res.status(500).json({ message: "Failed to block customer" });
    }
  },
);

// Unblock customer
router.post(
  "/:customerId/unblock",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { customerId } = req.params;

      const unblockedCustomer = await db
        .update(users)
        .set({
          isBlocked: false,
          blockedAt: null,
          blockedReason: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, customerId))
        .returning();

      res.json({
        data: unblockedCustomer[0],
        message: "Customer unblocked successfully",
      });
    } catch (error) {
      console.error("Error unblocking customer:", error);
      res.status(500).json({ message: "Failed to unblock customer" });
    }
  },
);

export default router;
