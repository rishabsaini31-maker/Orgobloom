import { Router, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { shipments, orders } from "../db/schema/index.js";
import { eq, and } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { createId } from "@paralleldrive/cuid2";

const router = Router();

// Get shipment by order ID
router.get(
  "/order/:orderId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      // Verify order belongs to user (or user is admin)
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      if (order.userId !== userId && req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.orderId, orderId));

      if (!shipment) {
        return res.json({ shipment: null });
      }

      res.json({ shipment });
    } catch (error) {
      next(error);
    }
  },
);

// Get shipment by tracking number (public endpoint)
router.get("/track/:trackingNumber", async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;

    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.trackingNumber, trackingNumber));

    if (!shipment) {
      throw new ApiError("Shipment not found", 404);
    }

    // Get order details (limited info for public)
    const [order] = await db
      .select({
        id: orders.id,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.id, shipment.orderId));

    res.json({
      shipment: {
        id: shipment.id,
        carrier: shipment.carrier,
        trackingNumber: shipment.trackingNumber,
        trackingUrl: shipment.trackingUrl,
        status: shipment.status,
        trackingEvents: shipment.trackingEvents,
        estimatedDelivery: shipment.estimatedDelivery,
        shippedAt: shipment.shippedAt,
        deliveredAt: shipment.deliveredAt,
      },
      order: {
        id: order?.id,
        status: order?.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Create shipment for order
router.post(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const {
        orderId,
        carrier,
        carrierCode,
        trackingNumber,
        trackingUrl,
        shippingAddress,
        estimatedDelivery,
        shippingCost,
        codAmount,
        weight,
        dimensions,
        notes,
      } = req.body;

      // Verify order exists
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      // Check if shipment already exists
      const [existingShipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.orderId, orderId));

      if (existingShipment) {
        throw new ApiError("Shipment already exists for this order", 400);
      }

      // Create initial tracking event
      const initialEvent = {
        id: createId(),
        status: "PENDING",
        description: "Shipment created, awaiting pickup",
        timestamp: new Date().toISOString(),
      };

      const [shipment] = await db
        .insert(shipments)
        .values({
          orderId,
          carrier,
          carrierCode,
          trackingNumber,
          trackingUrl,
          shippingAddress,
          status: "PENDING",
          trackingEvents: [initialEvent],
          estimatedDelivery: estimatedDelivery
            ? new Date(estimatedDelivery)
            : null,
          shippingCost: shippingCost || "0",
          codAmount,
          weight,
          dimensions,
          notes,
          shippedAt: new Date(),
        })
        .returning();

      // Update order status to SHIPPED
      await db
        .update(orders)
        .set({
          status: "SHIPPED",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      res.status(201).json({
        success: true,
        shipment,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Admin: Update shipment status
router.put(
  "/:shipmentId/status",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { shipmentId } = req.params;
      const { status, description, location } = req.body;

      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId));

      if (!shipment) {
        throw new ApiError("Shipment not found", 404);
      }

      // Add new tracking event
      const newEvent = {
        id: createId(),
        status,
        description: description || getStatusDescription(status),
        location,
        timestamp: new Date().toISOString(),
      };

      const trackingEvents = [...(shipment.trackingEvents || []), newEvent];

      // Update shipment
      const updateData: any = {
        status,
        trackingEvents,
        updatedAt: new Date(),
      };

      if (status === "DELIVERED") {
        updateData.deliveredAt = new Date();

        // Update order status to DELIVERED
        await db
          .update(orders)
          .set({
            status: "DELIVERED",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, shipment.orderId));
      }

      const [updatedShipment] = await db
        .update(shipments)
        .set(updateData)
        .where(eq(shipments.id, shipmentId))
        .returning();

      res.json({
        success: true,
        shipment: updatedShipment,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Admin: Update shipment details
router.put(
  "/:shipmentId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { shipmentId } = req.params;
      const {
        carrier,
        carrierCode,
        trackingNumber,
        trackingUrl,
        estimatedDelivery,
        shippingCost,
        weight,
        dimensions,
        notes,
      } = req.body;

      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId));

      if (!shipment) {
        throw new ApiError("Shipment not found", 404);
      }

      const [updatedShipment] = await db
        .update(shipments)
        .set({
          carrier: carrier || shipment.carrier,
          carrierCode: carrierCode || shipment.carrierCode,
          trackingNumber: trackingNumber || shipment.trackingNumber,
          trackingUrl: trackingUrl || shipment.trackingUrl,
          estimatedDelivery: estimatedDelivery
            ? new Date(estimatedDelivery)
            : shipment.estimatedDelivery,
          shippingCost: shippingCost || shipment.shippingCost,
          weight: weight || shipment.weight,
          dimensions: dimensions || shipment.dimensions,
          notes: notes !== undefined ? notes : shipment.notes,
          updatedAt: new Date(),
        })
        .where(eq(shipments.id, shipmentId))
        .returning();

      res.json({
        success: true,
        shipment: updatedShipment,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Admin: Get all shipments (with filters)
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { status, carrier, page = "1", limit = "20" } = req.query;

      let allShipments;

      if (status && carrier) {
        allShipments = await db
          .select()
          .from(shipments)
          .where(
            and(
              eq(shipments.status, status as string),
              eq(shipments.carrier, carrier as string),
            ),
          );
      } else if (status) {
        allShipments = await db
          .select()
          .from(shipments)
          .where(eq(shipments.status, status as string));
      } else if (carrier) {
        allShipments = await db
          .select()
          .from(shipments)
          .where(eq(shipments.carrier, carrier as string));
      } else {
        allShipments = await db.select().from(shipments);
      }

      res.json({
        shipments: allShipments,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: allShipments.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Helper function to get status description
function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    PENDING: "Shipment created, awaiting pickup",
    PICKED_UP: "Shipment picked up by carrier",
    IN_TRANSIT: "Shipment in transit",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERED: "Shipment delivered successfully",
    FAILED: "Delivery attempt failed",
    RETURNED: "Shipment returned to sender",
    CANCELLED: "Shipment cancelled",
  };
  return descriptions[status] || status;
}

export default router;
