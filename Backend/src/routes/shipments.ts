import { Router, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { shipments, orders } from "../db/schema/index.js";
import { eq, and } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { createId } from "@paralleldrive/cuid2";
import { shipmentService } from "../services/shipment/shipmentService.js";
import { logger } from "../utils/logger.js";

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

// Admin: Create shipment with F Ship integration
router.post(
  "/fship/create",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { orderId, preferredCarrier } = req.body;

      if (!orderId) {
        throw new ApiError("Order ID is required", 400);
      }

      logger.info(`[API] Creating F Ship shipment for order: ${orderId}`);

      const result = await shipmentService.createShipment(
        orderId,
        preferredCarrier
      );

      if (!result.success) {
        throw new ApiError(result.error || "Failed to create shipment", 400);
      }

      res.status(201).json({
        success: true,
        message: "Shipment created and sent to F Ship successfully",
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get tracking details with F Ship sync
router.get(
  "/track/details/:trackingNumber",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { trackingNumber } = req.params;

      if (!trackingNumber) {
        throw new ApiError("Tracking number is required", 400);
      }

      logger.info(`[API] Fetching tracking details for: ${trackingNumber}`);

      const result = await shipmentService.getTrackingDetails(trackingNumber);

      if (!result.success) {
        throw new ApiError(result.error || "Shipment not found", 404);
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get shipping rates
router.get(
  "/rates",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pincode, state, weight } = req.query;

      if (!pincode || !state) {
        throw new ApiError("Pincode and state are required", 400);
      }

      logger.info(`[API] Fetching shipping rates for pincode: ${pincode}`);

      const result = await shipmentService.getShippingRates(
        pincode as string,
        parseFloat(weight as string) || 2,
        state as string
      );

      if (!result.success) {
        throw new ApiError(result.error || "Failed to fetch rates", 400);
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Admin: Cancel shipment
router.delete(
  "/:trackingNumber/cancel",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { trackingNumber } = req.params;

      if (!trackingNumber) {
        throw new ApiError("Tracking number is required", 400);
      }

      logger.info(`[API] Cancelling shipment: ${trackingNumber}`);

      const result = await shipmentService.cancelShipment(trackingNumber);

      if (!result.success) {
        throw new ApiError(result.error || "Failed to cancel shipment", 400);
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
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
