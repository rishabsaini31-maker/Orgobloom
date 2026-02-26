import { Router, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { shipments, orders, orderItems, products } from "../db/schema/index.js";
import { eq, and } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { createId } from "@paralleldrive/cuid2";
import shiprocketService from "../utils/shiprocketService.js";
import { notifications } from "../utils/notifications.js";
import { sendEmail } from "../utils/emailService.js";
import { emailTemplates } from "../templates/emailTemplates.js";
import { users } from "../db/schema/users.js";

const router = Router();

// Helper to format address for Shiprocket
const formatAddress = (address: any) => ({
  name: address.fullName || address.name || "",
  phone: address.phone || "",
  address: address.addressLine1 || address.address || "",
  address_2: address.addressLine2 || "",
  city: address.city || "",
  state: address.state || "",
  country: address.country || "India",
  pin_code: address.pincode || address.pinCode || "",
  email: address.email || "",
});

// Create shipment for order via Shiprocket
router.post(
  "/create/:orderId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { orderId } = req.params;
      const { pickupLocation, weight, courierId } = req.body;

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

      // Parse shipping address
      const shippingAddress =
        typeof order.shippingAddress === "string"
          ? JSON.parse(order.shippingAddress)
          : order.shippingAddress;

      // Prepare Shiprocket order data
      const shiprocketOrderData = {
        order_id: order.orderNumber,
        order_date: order.createdAt.toISOString().split("T")[0],
        pickup_location: pickupLocation || "Primary",
        billing_address: formatAddress(shippingAddress),
        shipping_address: formatAddress(shippingAddress),
        order_items: items.map((item) => ({
          name: item.productName || `Product ${item.productId}`,
          sku: item.productSlug || item.productId,
          units: Number(item.quantity),
          selling_price: Number(item.price),
          discount: 0,
          tax: 0,
        })),
        payment_method: order.paymentStatus === "COMPLETED" ? "Prepaid" : "COD",
        shipping_charges: Number(order.shippingCost || 0),
        sub_total: Number(order.total ?? 0),
        weight: Number(weight || 0.5), // Default 500g
        length: 20,
        breadth: 15,
        height: 10,
      };

      // Create order in Shiprocket
      const shiprocketResult =
        await shiprocketService.createShiprocketOrder(shiprocketOrderData);

      // Generate AWB if not auto-assigned
      let awbCode = shiprocketResult.awbCode;
      let courierName = shiprocketResult.courierName;

      if (!awbCode && courierId) {
        const awbResult = await shiprocketService.generateAWB(
          shiprocketResult.shipmentId,
          courierId,
        );
        awbCode = awbResult.awbCode;
        courierName = awbResult.courierName;
      }

      // Request pickup
      if (awbCode) {
        await shiprocketService.requestPickup(shiprocketResult.shipmentId);
      }

      // Create initial tracking event
      const initialEvent = {
        id: createId(),
        status: "PENDING",
        description: "Shipment created with Shiprocket",
        timestamp: new Date().toISOString(),
      };

      // Save shipment to database
      const [shipment] = await db
        .insert(shipments)
        .values({
          orderId,
          carrier: courierName || "Shiprocket",
          carrierCode: "SHIPROCKET",
          trackingNumber: awbCode || "",
          trackingUrl: awbCode
            ? `https://www.shiprocket.in/shipment/tracking/${awbCode}`
            : null,
          shippingAddress: shippingAddress,
          status: "PENDING",
          trackingEvents: [initialEvent],
          shippingCost: String(order.shippingCost || 0),
          weight: String(weight || 0.5),
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
        notifications.orderShipped(
          order.userId,
          order.orderNumber,
          awbCode || undefined,
        );
      }

      // Send email notification
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1);

      if (user?.email) {
        const emailContent = emailTemplates.shippingNotificationEmail(
          user.name || "Customer",
          order.orderNumber,
          awbCode || "Pending",
          courierName || "Shiprocket",
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
        shiprocket: {
          orderId: shiprocketResult.orderId,
          shipmentId: shiprocketResult.shipmentId,
          awbCode,
          courierName,
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

      const trackingData =
        await shiprocketService.trackShipment(trackingNumber);

      res.json({
        success: true,
        tracking: trackingData,
      });
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

      const result = await shiprocketService.checkServiceability(
        pickupPincode,
        deliveryPincode,
        weight,
        codAmount,
      );

      res.json({
        success: true,
        serviceability: result,
      });
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

      // Get shipment details
      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId))
        .limit(1);

      if (!shipment) {
        throw new ApiError("Shipment not found", 404);
      }

      if (!shipment.trackingNumber) {
        throw new ApiError("No AWB code found for this shipment", 400);
      }

      // Cancel in Shiprocket
      await shiprocketService.cancelShipment([shipment.trackingNumber]);

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

// Get pickup locations
router.get(
  "/pickup-locations",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const locations = await shiprocketService.getPickupLocations();

      res.json({
        success: true,
        locations,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Create return order
router.post(
  "/return/:orderId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { orderId } = req.params;
      const { pickupAddress, weight } = req.body;

      // Get order details
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      // Get order items
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

      // Parse shipping address
      const shippingAddress =
        typeof order.shippingAddress === "string"
          ? JSON.parse(order.shippingAddress)
          : order.shippingAddress;

      // Create return order in Shiprocket
      const returnOrderData = {
        order_id: `RETURN-${order.orderNumber}`,
        order_date: new Date().toISOString().split("T")[0],
        pickup_customer_name:
          shippingAddress.fullName || shippingAddress.name || "",
        pickup_address:
          shippingAddress.addressLine1 || shippingAddress.address || "",
        pickup_city: shippingAddress.city || "",
        pickup_state: shippingAddress.state || "",
        pickup_country: "India",
        pickup_pincode:
          shippingAddress.pincode || shippingAddress.pinCode || "",
        pickup_phone: shippingAddress.phone || "",
        shipping_customer_name: pickupAddress?.name || "Orgobloom",
        shipping_address: pickupAddress?.address || "",
        shipping_city: pickupAddress?.city || "",
        shipping_state: pickupAddress?.state || "",
        shipping_country: "India",
        shipping_pincode: pickupAddress?.pincode || "",
        shipping_phone: pickupAddress?.phone || "",
        order_items: items.map((item) => ({
          name: item.productName || `Product ${item.productId}`,
          sku: item.productSlug || item.productId,
          units: Number(item.quantity),
          selling_price: Number(item.price),
        })),
        payment_method: "Prepaid",
        sub_total: Number(order.total ?? 0),
        weight: Number(weight || 0.5),
      };

      const result = await shiprocketService.createReturnOrder(returnOrderData);

      res.status(201).json({
        success: true,
        returnOrder: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Sync tracking status (for cron job or manual trigger)
router.post(
  "/sync-tracking/:shipmentId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { shipmentId } = req.params;

      // Get shipment details
      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId))
        .limit(1);

      if (!shipment) {
        throw new ApiError("Shipment not found", 404);
      }

      if (!shipment.trackingNumber) {
        throw new ApiError("No tracking number found", 400);
      }

      // Get tracking data from Shiprocket
      const trackingData = await shiprocketService.trackShipment(
        shipment.trackingNumber,
      );

      // Map Shiprocket status to our status
      const statusMap: Record<string, string> = {
        PENDING: "PENDING",
        "PICKUP PENDING": "PENDING",
        "PICKUP GENERATED": "PENDING",
        "PICKUP CANCELLED": "PENDING",
        "PICKUP RESCHEDULED": "PENDING",
        "IN TRANSIT": "IN_TRANSIT",
        "OUT FOR DELIVERY": "OUT_FOR_DELIVERY",
        DELIVERED: "DELIVERED",
        CANCELLED: "CANCELLED",
        RTO: "RETURNED",
        "RTO INITIATED": "RETURNED",
        "RTO DELIVERED": "RETURNED",
      };

      const currentStatus =
        trackingData.current_status?.toUpperCase() || "PENDING";
      const mappedStatus = statusMap[currentStatus] || "IN_TRANSIT";

      // Build tracking events
      const trackingEvents =
        trackingData.tracking_data?.shipment_track_activities?.map(
          (activity) => ({
            id: createId(),
            status: activity.status,
            description: activity.activity,
            location: activity.location,
            timestamp: `${activity.date} ${activity.time}`,
          }),
        ) || [];

      // Update shipment
      const updateData: any = {
        status: mappedStatus,
        trackingEvents,
        updatedAt: new Date(),
      };

      if (mappedStatus === "DELIVERED") {
        updateData.deliveredAt = new Date();

        // Update order status
        await db
          .update(orders)
          .set({
            status: "DELIVERED",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, shipment.orderId));

        // Send notification
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, shipment.orderId))
          .limit(1);

        if (order?.userId) {
          notifications.orderDelivered(order.userId, order.orderNumber);
        }
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
