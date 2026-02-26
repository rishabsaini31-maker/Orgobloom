import { Router, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { shipments, orders, orderItems, products } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { createId } from "@paralleldrive/cuid2";
import fshipService from "../utils/fshipService.js";
import { sendToUser, NotificationType } from "../utils/notifications.js";
import { sendEmail } from "../utils/emailService.js";

const router = Router();

// Check serviceability
router.post(
  "/serviceability",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { pickupPincode, deliveryPincode, weight, codAmount } = req.body;

      if (!pickupPincode || !deliveryPincode || !weight) {
        throw new ApiError(
          "Pickup pincode, delivery pincode, and weight are required",
          400,
        );
      }

      const result = await fshipService.checkServiceability(
        pickupPincode,
        deliveryPincode,
        weight,
        codAmount,
      );

      res.json({
        success: true,
        couriers: result.courier_partners,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Calculate shipping rate
router.post(
  "/calculate-rate",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { pickupPincode, deliveryPincode, weight, codAmount } = req.body;

      if (!pickupPincode || !deliveryPincode || !weight) {
        throw new ApiError(
          "Pickup pincode, delivery pincode, and weight are required",
          400,
        );
      }

      const result = await fshipService.calculateRate(
        pickupPincode,
        deliveryPincode,
        weight,
        codAmount,
      );

      res.json({
        success: true,
        rate: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Create shipment for order
router.post(
  "/create/:orderId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { orderId } = req.params;
      const { courierId, weight, length, breadth, height } = req.body;

      // Get order details
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      // Check if shipment already exists
      const [existingShipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.orderId, orderId))
        .limit(1);

      if (existingShipment) {
        throw new ApiError("Shipment already exists for this order", 400);
      }

      // Get order items
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      // Parse shipping address
      const shippingAddress = JSON.parse(order.shippingAddress as string);

      // Determine payment type
      const paymentType =
        order.paymentStatus === "COMPLETED" ? "PREPAID" : "COD";
      const codAmount = paymentType === "COD" ? order.total : undefined;

      // Create shipment with Fship
      const shipmentData = {
        order_id: order.orderNumber,
        customer_name: shippingAddress.name || shippingAddress.fullName,
        customer_phone: shippingAddress.phone,
        customer_address:
          shippingAddress.address || shippingAddress.addressLine1,
        customer_city: shippingAddress.city,
        customer_state: shippingAddress.state,
        customer_pincode: shippingAddress.pincode,
        customer_country: shippingAddress.country || "India",
        product_name: items.length > 0 ? "Multiple Products" : "Product",
        product_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        product_price: order.total,
        weight: weight || 0.5, // Default 500g
        length,
        breadth,
        height,
        cod_amount: codAmount,
        payment_type: paymentType as "PREPAID" | "COD",
        courier_id: courierId,
      };

      const result = await fshipService.createShipment(shipmentData);

      if (!result.success) {
        throw new ApiError(result.message || "Failed to create shipment", 400);
      }

      // Create initial tracking event
      const initialEvent = {
        id: createId(),
        status: "PENDING",
        description: "Shipment created, awaiting pickup",
        timestamp: new Date().toISOString(),
      };

      // Save shipment to database
      const [shipment] = await db
        .insert(shipments)
        .values({
          orderId,
          carrier: result.courier_name,
          carrierCode: "FSHIP",
          trackingNumber: result.awb_code,
          trackingUrl: `https://fship.in/track/${result.awb_code}`,
          status: "PENDING",
          trackingEvents: [initialEvent],
          shippingAddress: shippingAddress,
          shippingCost: "0",
          weight: weight?.toString() || "0.5",
          dimensions:
            length && breadth && height
              ? `${length}x${breadth}x${height}`
              : undefined,
          shippedAt: new Date(),
        })
        .returning();

      // Update order status
      await db
        .update(orders)
        .set({
          status: "SHIPPED",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Send notification to user
      if (order.userId) {
        sendToUser(order.userId, {
          id: createId(),
          type: NotificationType.ORDER_SHIPPED,
          title: "Order Shipped",
          message: `Your order ${order.orderNumber} has been shipped. Tracking: ${result.awb_code}`,
          data: {
            orderNumber: order.orderNumber,
            trackingNumber: result.awb_code,
          },
          createdAt: new Date(),
          read: false,
        });
      }

      res.status(201).json({
        success: true,
        shipment: {
          id: shipment.id,
          trackingNumber: result.awb_code,
          courier: result.courier_name,
          status: "PENDING",
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Track shipment
router.get("/track/:trackingNumber", async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;

    const result = await fshipService.trackShipment(trackingNumber);

    res.json({
      success: true,
      tracking: {
        awbCode: result.awb_code,
        status: result.status,
        currentLocation: result.current_location,
        scans: result.scans,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Cancel shipment
router.post(
  "/cancel/:shipmentId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { shipmentId } = req.params;

      // Get shipment from database
      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId))
        .limit(1);

      if (!shipment) {
        throw new ApiError("Shipment not found", 404);
      }

      // Cancel with Fship
      await fshipService.cancelShipment(shipmentId);

      // Update shipment status
      await db
        .update(shipments)
        .set({
          status: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(shipments.id, shipmentId));

      // Update order status
      await db
        .update(orders)
        .set({
          status: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, shipment.orderId));

      res.json({
        success: true,
        message: "Shipment cancelled successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get shipment label
router.get(
  "/label/:shipmentId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { shipmentId } = req.params;

      const result = await fshipService.generateLabel(shipmentId);

      res.json({
        success: true,
        labelUrl: result.label_url,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get available couriers
router.get(
  "/couriers",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const couriers = await fshipService.getCourierList();

      res.json({
        success: true,
        couriers,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Sync tracking for all active shipments
router.post(
  "/sync-tracking",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      // Get all active Fship shipments
      const activeShipments = await db
        .select()
        .from(shipments)
        .where(eq(shipments.carrierCode, "FSHIP"));

      let updated = 0;
      let failed = 0;

      for (const shipment of activeShipments) {
        if (!shipment.trackingNumber) continue;

        try {
          const tracking = await fshipService.trackShipment(
            shipment.trackingNumber,
          );

          // Map Fship status to our status
          const statusMap: Record<string, string> = {
            PENDING: "PENDING",
            "PICKUP PENDING": "PENDING",
            "PICKUP GENERATED": "PENDING",
            "IN TRANSIT": "IN_TRANSIT",
            "OUT FOR DELIVERY": "OUT_FOR_DELIVERY",
            DELIVERED: "DELIVERED",
            CANCELLED: "CANCELLED",
            RTO: "RETURNED",
          };

          const mappedStatus =
            statusMap[tracking.status.toUpperCase()] || shipment.status;

          // Update shipment
          const updateData: any = {
            status: mappedStatus,
            trackingEvents: tracking.scans.map((scan) => ({
              id: createId(),
              status: scan.status_code,
              description: scan.message,
              location: scan.location,
              timestamp: scan.timestamp,
            })),
            updatedAt: new Date(),
          };

          if (mappedStatus === "DELIVERED" && !shipment.deliveredAt) {
            updateData.deliveredAt = new Date();

            // Update order status
            await db
              .update(orders)
              .set({ status: "DELIVERED", updatedAt: new Date() })
              .where(eq(orders.id, shipment.orderId));
          }

          await db
            .update(shipments)
            .set(updateData)
            .where(eq(shipments.id, shipment.id));

          updated++;
        } catch (error) {
          console.error(
            `Failed to sync shipment ${shipment.trackingNumber}:`,
            error,
          );
          failed++;
        }
      }

      res.json({
        success: true,
        message: `Synced ${updated} shipments, ${failed} failed`,
        updated,
        failed,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
