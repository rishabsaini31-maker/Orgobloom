import { Router, Response, NextFunction } from "express";
import { db } from "../db/index.ts";
import {
  shipments,
  orders,
  orderItems,
  products,
  users,
} from "../db/schema/index.ts";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middleware/auth.ts";
import { ApiError } from "../middleware/errorHandler.ts";
import { createId } from "@paralleldrive/cuid2";
import delhiveryService from "../utils/delhiveryService.ts";
import { notifications } from "../utils/notifications.ts";
import { sendEmail } from "../utils/emailService.ts";
import { emailTemplates } from "../templates/emailTemplates.ts";

const router = Router();

// Create shipment for order via Delhivery
router.post(
  "/create/:orderId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { orderId } = req.params;
      const { weight, length, breadth, height } = req.body;

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      const [existingShipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.orderId, orderId))
        .limit(1);

      if (existingShipment) {
        throw new ApiError("Shipment already exists for this order", 400);
      }

      const items = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          productName: products.name,
          productSlug: products.slug,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, orderId));

      if (!items || items.length === 0) {
        throw new ApiError("No items found in order", 400);
      }

      const shippingAddress =
        typeof order.shippingAddress === "string"
          ? JSON.parse(order.shippingAddress)
          : order.shippingAddress;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1);

      const packageData = {
        order: order.orderNumber,
        phone: shippingAddress.phone || user?.phone || "",
        product: items.map((i) => i.productName).join(", "),
        cod_amount:
          order.paymentStatus === "COMPLETED"
            ? undefined
            : parseFloat(order.total?.toString() || "0"),
        payment_mode: (order.paymentStatus === "COMPLETED"
          ? "Prepaid"
          : "COD") as "Prepaid" | "COD",
        name:
          shippingAddress.fullName || shippingAddress.name || user?.name || "",
        add: shippingAddress.addressLine1 || shippingAddress.address || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        country: shippingAddress.country || "India",
        pin: shippingAddress.pincode || shippingAddress.pinCode || "",
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        weight: weight || 0.5,
        length: length || 20,
        breadth: breadth || 15,
        height: height || 10,
      };

      const delhiveryResult = await delhiveryService.createDelhiveryShipment([
        packageData,
      ]);

      const waybill = delhiveryResult.packages?.[0]?.waybill;

      if (!waybill) {
        throw new ApiError("Failed to get waybill from Delhivery", 500);
      }

      const initialEvent = {
        id: createId(),
        status: "PENDING",
        description: "Shipment created with Delhivery",
        timestamp: new Date().toISOString(),
      };

      const [shipment] = await db
        .insert(shipments)
        .values({
          orderId,
          carrier: "Delhivery",
          carrierCode: "DELHIVERY",
          trackingNumber: waybill,
          trackingUrl: `https://www.delhivery.com/track/package/${waybill}`,
          shippingAddress: shippingAddress,
          status: "PENDING",
          trackingEvents: [initialEvent],
          shippingCost: order.shippingCost || "0",
          weight: weight?.toString() || "0.5",
          shippedAt: new Date(),
        })
        .returning();

      await db
        .update(orders)
        .set({ status: "SHIPPED", updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      if (order.userId) {
        notifications.orderShipped(order.userId, order.orderNumber, waybill);
      }

      if (user?.email) {
        const emailContent = emailTemplates.shippingNotificationEmail(
          user.name || "Customer",
          order.orderNumber,
          waybill,
          "Delhivery",
        );
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        }).catch((err) => console.error("Shipment email failed:", err));
      }

      res.status(201).json({
        success: true,
        shipment,
        delhivery: {
          waybill,
          refnum: delhiveryResult.packages?.[0]?.refnum,
          status: delhiveryResult.packages?.[0]?.status,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Track shipment
router.get(
  "/track/:trackingNumber",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { trackingNumber } = req.params;
      const trackingData = await delhiveryService.trackShipment(trackingNumber);
      res.json({ success: true, tracking: trackingData });
    } catch (error) {
      next(error);
    }
  },
);

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
      const result = await delhiveryService.checkServiceability(
        pickupPincode,
        deliveryPincode,
        weight,
        codAmount,
      );
      res.json({ success: true, serviceability: result });
    } catch (error) {
      next(error);
    }
  },
);

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
      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId))
        .limit(1);
      if (!shipment) throw new ApiError("Shipment not found", 404);
      if (!shipment.trackingNumber) throw new ApiError("No waybill found", 400);

      await delhiveryService.cancelShipment([shipment.trackingNumber]);
      await db
        .update(shipments)
        .set({ status: "CANCELLED", updatedAt: new Date() })
        .where(eq(shipments.id, shipmentId));
      await db
        .update(orders)
        .set({ status: "CANCELLED", updatedAt: new Date() })
        .where(eq(orders.id, shipment.orderId));

      res.json({ success: true, message: "Shipment cancelled successfully" });
    } catch (error) {
      next(error);
    }
  },
);

// Sync tracking status
router.post(
  "/sync-tracking/:shipmentId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") throw new ApiError("Unauthorized", 403);

      const { shipmentId } = req.params;
      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId))
        .limit(1);
      if (!shipment) throw new ApiError("Shipment not found", 404);
      if (!shipment.trackingNumber)
        throw new ApiError("No tracking number found", 400);

      const trackingData = await delhiveryService.trackShipment(
        shipment.trackingNumber,
      );
      const shipmentInfo = trackingData.ShipmentData?.[0]?.Shipment;

      const statusMap: Record<string, string> = {
        UD: "IN_TRANSIT",
        DL: "DELIVERED",
        OO: "OUT_FOR_DELIVERY",
        PP: "PENDING",
        RTO: "RETURNED",
        OT: "IN_TRANSIT",
      };

      const currentStatus = shipmentInfo?.Status?.StatusType || "PP";
      const mappedStatus = statusMap[currentStatus] || "IN_TRANSIT";

      const trackingEvents =
        shipmentInfo?.Scans?.map((scan) => ({
          id: createId(),
          status: scan.ScanDetail.ScanType,
          description: scan.ScanDetail.Scan,
          location: scan.ScanDetail.ScannedLocation,
          timestamp: scan.ScanDetail.ScanDateTime,
        })) || [];

      const updateData: any = {
        status: mappedStatus,
        trackingEvents,
        updatedAt: new Date(),
      };

      if (mappedStatus === "DELIVERED") {
        updateData.deliveredAt = new Date();
        await db
          .update(orders)
          .set({ status: "DELIVERED", updatedAt: new Date() })
          .where(eq(orders.id, shipment.orderId));

        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, shipment.orderId))
          .limit(1);
        if (order?.userId)
          notifications.orderDelivered(order.userId, order.orderNumber);
      }

      const [updatedShipment] = await db
        .update(shipments)
        .set(updateData)
        .where(eq(shipments.id, shipmentId))
        .returning();

      res.json({
        success: true,
        shipment: updatedShipment,
        trackingStatus: currentStatus,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
