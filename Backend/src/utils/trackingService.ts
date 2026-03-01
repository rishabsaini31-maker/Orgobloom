import { db } from "../db/index.js";
import { shipments, orders } from "../db/schema/index.js";
import { eq, and, inArray } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import shiprocketService from "./shiprocketService.js";
import delhiveryService from "./delhiveryService.js";
import fshipService from "./fshipService.js";
import { notifications } from "./notifications.js";
import { sendEmail } from "./emailService.js";
import { emailTemplates } from "../templates/emailTemplates.js";
import { users } from "../db/schema/index.js";

// Shipment status mapping
const SHIPMENT_STATUS_MAP: Record<string, Record<string, string>> = {
  SHIPROCKET: {
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
  },
  DELHIVERY: {
    UD: "IN_TRANSIT",
    DL: "DELIVERED",
    OO: "OUT_FOR_DELIVERY",
    PP: "PENDING",
    RTO: "RETURNED",
    OT: "IN_TRANSIT",
  },
  FSHIP: {
    PENDING: "PENDING",
    "PICKUP PENDING": "PENDING",
    "PICKUP GENERATED": "PENDING",
    "IN TRANSIT": "IN_TRANSIT",
    "OUT FOR DELIVERY": "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    RTO: "RETURNED",
  },
};

// Track single shipment
export const trackSingleShipment = async (
  shipmentId: string,
): Promise<{
  success: boolean;
  status: string;
  events: any[];
}> => {
  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.id, shipmentId))
    .limit(1);

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  if (!shipment.trackingNumber) {
    throw new Error("No tracking number found");
  }

  let trackingData: any = null;
  let mappedStatus = shipment.status;
  let trackingEvents: any[] = [];

  try {
    if (shipment.carrierCode === "SHIPROCKET") {
      trackingData = await shiprocketService.trackShipment(
        shipment.trackingNumber,
      );

      const currentStatus =
        trackingData.current_status?.toUpperCase() || "PENDING";
      mappedStatus =
        SHIPMENT_STATUS_MAP.SHIPROCKET[currentStatus] || "IN_TRANSIT";

      trackingEvents =
        trackingData.tracking_data?.shipment_track_activities?.map(
          (activity: any) => ({
            id: createId(),
            status: activity.status,
            description: activity.activity,
            location: activity.location,
            timestamp: `${activity.date} ${activity.time}`,
          }),
        ) || [];
    } else if (shipment.carrierCode === "DELHIVERY") {
      trackingData = await delhiveryService.trackShipment(
        shipment.trackingNumber,
      );

      const shipmentInfo = trackingData.ShipmentData?.[0]?.Shipment;
      const currentStatus = shipmentInfo?.Status?.StatusType || "PP";
      mappedStatus =
        SHIPMENT_STATUS_MAP.DELHIVERY[currentStatus] || "IN_TRANSIT";

      trackingEvents =
        shipmentInfo?.Scans?.map((scan: any) => ({
          id: createId(),
          status: scan.ScanDetail.ScanType,
          description: scan.ScanDetail.Scan,
          location: scan.ScanDetail.ScannedLocation,
          timestamp: scan.ScanDetail.ScanDateTime,
        })) || [];
    } else if (shipment.carrierCode === "FSHIP") {
      trackingData = await fshipService.trackShipment(shipment.trackingNumber);

      const currentStatus = trackingData.status?.toUpperCase() || "PENDING";
      mappedStatus = SHIPMENT_STATUS_MAP.FSHIP[currentStatus] || "IN_TRANSIT";

      trackingEvents =
        trackingData.scans?.map((scan: any) => ({
          id: createId(),
          status: scan.status_code || scan.status,
          description: scan.message,
          location: scan.location,
          timestamp: scan.timestamp,
        })) || [];
    }
  } catch (error) {
    console.error(
      `Failed to track shipment ${shipment.trackingNumber}:`,
      error,
    );
    return {
      success: false,
      status: shipment.status,
      events: [],
    };
  }

  // Update shipment in database
  const updateData: any = {
    status: mappedStatus,
    trackingEvents,
    updatedAt: new Date(),
  };

  if (mappedStatus === "DELIVERED" && !shipment.deliveredAt) {
    updateData.deliveredAt = new Date();

    // Update order status
    await db
      .update(orders)
      .set({ status: "DELIVERED", updatedAt: new Date() })
      .where(eq(orders.id, shipment.orderId));

    // Send notification
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, shipment.orderId))
      .limit(1);

    if (order?.userId) {
      notifications.orderDelivered(order.userId, order.orderNumber);

      // Send email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1);

      if (user?.email) {
        const emailContent = emailTemplates.shippingNotificationEmail(
          user.name || "Customer",
          order.orderNumber,
          "Delivered",
          shipment.carrier || "Carrier",
        );
        await sendEmail({
          to: user.email,
          subject: `Order Delivered - #${order.orderNumber}`,
          html: emailContent.html,
          text: emailContent.text,
        }).catch((err) => console.error("Delivery email failed:", err));
      }
    }
  }

  await db
    .update(shipments)
    .set(updateData)
    .where(eq(shipments.id, shipmentId));

  return {
    success: true,
    status: mappedStatus,
    events: trackingEvents,
  };
};

// Track all active shipments
export const trackAllActiveShipments = async (): Promise<{
  total: number;
  updated: number;
  failed: number;
  results: Array<{
    shipmentId: string;
    trackingNumber: string;
    success: boolean;
    status: string;
  }>;
}> => {
  // Get all active shipments (not delivered, cancelled, or returned)
  const activeShipments = await db
    .select()
    .from(shipments)
    .where(
      and(
        inArray(shipments.status, [
          "PENDING",
          "IN_TRANSIT",
          "OUT_FOR_DELIVERY",
        ]),
      ),
    );

  const results: Array<{
    shipmentId: string;
    trackingNumber: string;
    success: boolean;
    status: string;
  }> = [];
  let updated = 0;
  let failed = 0;

  for (const shipment of activeShipments) {
    try {
      const result = await trackSingleShipment(shipment.id);
      if (result.success) {
        updated++;
      } else {
        failed++;
      }
      results.push({
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber || "",
        success: result.success,
        status: result.status,
      });
    } catch (error) {
      failed++;
      results.push({
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber || "",
        success: false,
        status: shipment.status,
      });
    }
  }

  return {
    total: activeShipments.length,
    updated,
    failed,
    results,
  };
};

// Track shipments by carrier
export const trackShipmentsByCarrier = async (
  carrierCode: "SHIPROCKET" | "DELHIVERY",
): Promise<{
  total: number;
  updated: number;
  failed: number;
}> => {
  const carrierShipments = await db
    .select()
    .from(shipments)
    .where(
      and(
        eq(shipments.carrierCode, carrierCode),
        inArray(shipments.status, [
          "PENDING",
          "IN_TRANSIT",
          "OUT_FOR_DELIVERY",
        ]),
      ),
    );

  let updated = 0;
  let failed = 0;

  for (const shipment of carrierShipments) {
    try {
      const result = await trackSingleShipment(shipment.id);
      if (result.success) {
        updated++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
  }

  return {
    total: carrierShipments.length,
    updated,
    failed,
  };
};

// Get shipment tracking history
export const getTrackingHistory = async (
  shipmentId: string,
): Promise<{
  shipment: any;
  events: any[];
}> => {
  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.id, shipmentId))
    .limit(1);

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  return {
    shipment: {
      id: shipment.id,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      status: shipment.status,
      shippedAt: shipment.shippedAt,
      deliveredAt: shipment.deliveredAt,
      estimatedDelivery: shipment.estimatedDelivery,
    },
    events: shipment.trackingEvents || [],
  };
};

export default {
  trackSingleShipment,
  trackAllActiveShipments,
  trackShipmentsByCarrier,
  getTrackingHistory,
};
