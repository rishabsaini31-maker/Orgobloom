import { Router, Response, NextFunction } from "express";
import { db } from "@/db";
import { products, orders, users } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { authenticate, isAdmin, AuthRequest } from "@/middleware/auth.js";
import { ApiError } from "@/middleware/errorHandler.js";
import { auditLogFromRequest } from "@/utils/auditService.js";

const router = Router();

// All bulk routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// ==================== PRODUCTS BULK OPERATIONS ====================

// Bulk update product status
router.post(
  "/products/status",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { productIds, status } = req.body;

      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new ApiError("Product IDs array is required", 400);
      }

      if (!["ACTIVE", "INACTIVE", "OUT_OF_STOCK"].includes(status)) {
        throw new ApiError("Invalid status value", 400);
      }

      // Get current values for audit log
      const currentProducts = await db
        .select()
        .from(products)
        .where(inArray(products.id, productIds));

      // Update products
      const updated = await db
        .update(products)
        .set({ status, updatedAt: new Date().toISOString() })
        .where(inArray(products.id, productIds))
        .returning();

      // Create audit log
      await auditLogFromRequest(req, {
        action: "BULK_UPDATE",
        entityType: "PRODUCT",
        description: `Updated status to ${status} for ${updated.length} products`,
        oldValues: {
          productIds,
          oldStatuses: currentProducts.map((p) => ({
            id: p.id,
            status: p.status,
          })),
        },
        newValues: { productIds, newStatus: status },
      });

      res.json({
        success: true,
        message: `Updated ${updated.length} products`,
        updated: updated.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Bulk delete products
router.post(
  "/products/delete",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { productIds } = req.body;

      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new ApiError("Product IDs array is required", 400);
      }

      // Get current values for audit log
      const currentProducts = await db
        .select()
        .from(products)
        .where(inArray(products.id, productIds));

      // Delete products
      const deleted = await db
        .delete(products)
        .where(inArray(products.id, productIds))
        .returning();

      // Create audit log
      await auditLogFromRequest(req, {
        action: "BULK_DELETE",
        entityType: "PRODUCT",
        description: `Deleted ${deleted.length} products`,
        oldValues: { products: currentProducts },
        newValues: null,
      });

      res.json({
        success: true,
        message: `Deleted ${deleted.length} products`,
        deleted: deleted.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Bulk update product featured status
router.post(
  "/products/featured",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { productIds, featured } = req.body;

      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new ApiError("Product IDs array is required", 400);
      }

      const isFeatured = Boolean(featured);

      const updated = await db
        .update(products)
        .set({ isFeatured, updatedAt: new Date().toISOString() })
        .where(inArray(products.id, productIds))
        .returning();

      await auditLogFromRequest(req, {
        action: "BULK_UPDATE",
        entityType: "PRODUCT",
        description: `${isFeatured ? "Featured" : "Unfeatured"} ${updated.length} products`,
        newValues: { productIds, isFeatured },
      });

      res.json({
        success: true,
        message: `Updated ${updated.length} products`,
        updated: updated.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ==================== ORDERS BULK OPERATIONS ====================

// Bulk update order status
router.post(
  "/orders/status",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderIds, status } = req.body;

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        throw new ApiError("Order IDs array is required", 400);
      }

      const validStatuses = [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ];
      if (!validStatuses.includes(status)) {
        throw new ApiError("Invalid status value", 400);
      }

      // Get current values for audit log
      const currentOrders = await db
        .select()
        .from(orders)
        .where(inArray(orders.id, orderIds));

      // Update orders
      const updated = await db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(inArray(orders.id, orderIds))
        .returning();

      await auditLogFromRequest(req, {
        action: "BULK_UPDATE",
        entityType: "ORDER",
        description: `Updated status to ${status} for ${updated.length} orders`,
        oldValues: {
          orderIds,
          oldStatuses: currentOrders.map((o) => ({
            id: o.id,
            status: o.status,
          })),
        },
        newValues: { orderIds, newStatus: status },
      });

      res.json({
        success: true,
        message: `Updated ${updated.length} orders`,
        updated: updated.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ==================== CUSTOMERS BULK OPERATIONS ====================

// Bulk block/unblock customers
router.post(
  "/customers/block",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userIds, blocked, reason } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new ApiError("User IDs array is required", 400);
      }

      const isBlocked = Boolean(blocked);

      // Get current values for audit log
      const currentUsers = await db
        .select()
        .from(users)
        .where(inArray(users.id, userIds));

      // Update users
      const updated = await db
        .update(users)
        .set({
          isBlocked,
          blockedAt: isBlocked ? new Date() : null,
          blockedReason: isBlocked ? reason : null,
          updatedAt: new Date(),
        })
        .where(inArray(users.id, userIds))
        .returning();

      await auditLogFromRequest(req, {
        action: "BULK_UPDATE",
        entityType: "CUSTOMER",
        description: `${isBlocked ? "Blocked" : "Unblocked"} ${updated.length} customers`,
        oldValues: {
          userIds,
          oldBlocked: currentUsers.map((u) => ({
            id: u.id,
            isBlocked: u.isBlocked,
          })),
        },
        newValues: { userIds, isBlocked, reason },
      });

      res.json({
        success: true,
        message: `${isBlocked ? "Blocked" : "Unblocked"} ${updated.length} customers`,
        updated: updated.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Bulk export customers
router.post(
  "/customers/export",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new ApiError("User IDs array is required", 400);
      }

      const customers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          isBlocked: users.isBlocked,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(inArray(users.id, userIds));

      await auditLogFromRequest(req, {
        action: "EXPORT",
        entityType: "CUSTOMER",
        description: `Exported ${customers.length} customers`,
        newValues: { userIds, count: customers.length },
      });

      res.json({
        success: true,
        customers,
        count: customers.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
