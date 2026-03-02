import { db } from "../../db/index.js";
import { shipments, orders } from "../../db/schema/index.js";
import { eq, and } from "drizzle-orm";
import { fShipService } from "./fShipService.js";
import { sendEmail } from "../../utils/emailService.js";
import { createId } from "@paralleldrive/cuid2";

export class ShipmentService {
  /**
   * Create shipment and send to F Ship
   */
  async createShipment(
    orderId: string,
    preferredCarrier?: string,
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log(`[Shipment] Creating shipment for order: ${orderId}`);

      // Get order details
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) {
        return { success: false, error: "Order not found" };
      }

      if (order.status !== "CONFIRMED") {
        return {
          success: false,
          error: `Cannot create shipment for order with status: ${order.status}`,
        };
      }

      // Parse shipping address
      const shippingAddress = JSON.parse(order.shippingAddress || "{}");

      // Prepare F Ship payload with basic info from order
      const fShipPayload = {
        order_id: order.orderNumber || orderId,
        customer_name: "Customer", // Store this in order during checkout if needed
        customer_phone: "9876543210", // Store this in order during checkout if needed
        customer_email: "customer@example.com", // Store this in order during checkout if needed
        shipping_address: {
          address_line1: shippingAddress.addressLine1 || "",
          address_line2: shippingAddress.addressLine2 || "",
          city: shippingAddress.city || "",
          state: shippingAddress.state || "",
          pincode: shippingAddress.pincode || "",
          country: shippingAddress.country || "India",
        },
        order_items: [
          {
            name: "Order Items",
            quantity: 1,
            price: order.total || 0,
          },
        ],
        cod: order.paymentStatus === "PENDING",
        weight: 2,
      };

      // Create shipment with F Ship
      const fShipResponse = await fShipService.createShipment(fShipPayload);

      if (!fShipResponse.success || !fShipResponse.data) {
        return {
          success: false,
          error: fShipResponse.error || "Failed to create shipment with F Ship",
        };
      }

      // Save shipment to database
      const [shipmentRecord] = await db
        .insert(shipments)
        .values({
          orderId,
          carrier: fShipResponse.data.carrier,
          carrierCode: fShipResponse.data.carrier.toLowerCase(),
          trackingNumber: fShipResponse.data.tracking_number,
          trackingUrl: fShipResponse.data.tracking_url,
          status: "PICKED_UP",
          shippingAddress: shippingAddress,
          estimatedDelivery: new Date(fShipResponse.data.estimated_delivery),
          shippedAt: new Date(),
          trackingEvents: [
            {
              id: createId(),
              timestamp: new Date().toISOString(),
              status: "PICKED_UP",
              location: "Warehouse",
              description: "Order picked up",
            },
          ] as any,
        })
        .returning();

      // Update order status to SHIPPED
      await db
        .update(orders)
        .set({
          status: "SHIPPED",
          trackingNumber: fShipResponse.data.tracking_number,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Send shipment notification email
      await this.sendShipmentNotificationEmail(
        order,
        fShipResponse.data.tracking_number,
        fShipResponse.data.tracking_url,
        fShipResponse.data.estimated_delivery,
      );

      console.log(
        `[Shipment] Shipment created successfully: ${fShipResponse.data.tracking_number}`,
      );

      return {
        success: true,
        data: {
          shipmentId: shipmentRecord?.id,
          trackingNumber: fShipResponse.data.tracking_number,
          trackingUrl: fShipResponse.data.tracking_url,
          estimatedDelivery: fShipResponse.data.estimated_delivery,
          carrier: fShipResponse.data.carrier,
        },
      };
    } catch (error: any) {
      console.error(`[Shipment] Error creating shipment: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get shipment tracking details
   */
  async getTrackingDetails(trackingNumber: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Get from database first
      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.trackingNumber, trackingNumber));

      if (!shipment) {
        return { success: false, error: "Shipment not found" };
      }

      // Fetch latest tracking from F Ship
      const fShipDetails =
        await fShipService.getTrackingDetails(trackingNumber);

      if (fShipDetails.success && fShipDetails.data) {
        // Update database with latest status
        await db
          .update(shipments)
          .set({
            status: fShipDetails.data.status,
            trackingEvents: fShipDetails.data.events as any,
            updatedAt: new Date(),
          })
          .where(eq(shipments.trackingNumber, trackingNumber));
      }

      return {
        success: true,
        data: {
          trackingNumber,
          carrier: shipment.carrier,
          status: fShipDetails.data?.status || shipment.status,
          currentLocation: fShipDetails.data?.current_location || "In Transit",
          estimatedDelivery:
            fShipDetails.data?.estimated_delivery || shipment.estimatedDelivery,
          trackingUrl: shipment.trackingUrl,
          trackingEvents: fShipDetails.data?.events || shipment.trackingEvents,
          shippedAt: shipment.shippedAt,
        },
      };
    } catch (error: any) {
      console.error(`[Shipment] Error fetching tracking: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get shipping rates for checkout
   */
  async getShippingRates(
    pincode: string,
    weight: number,
    state: string,
  ): Promise<{
    success: boolean;
    data?: Array<{
      carrier: string;
      rate: number;
      estimatedDeliveryDays: number;
    }>;
    error?: string;
  }> {
    try {
      if (!fShipService.isConfigured()) {
        // Return default rates if F Ship not configured
        return {
          success: true,
          data: [
            {
              carrier: "Standard",
              rate: 50,
              estimatedDeliveryDays: 5,
            },
            {
              carrier: "Express",
              rate: 100,
              estimatedDeliveryDays: 2,
            },
          ],
        };
      }

      const rates = await fShipService.getShippingRates(pincode, weight, state);
      return rates as any;
    } catch (error: any) {
      console.error(
        `[Shipment] Error fetching shipping rates: ${error.message}`,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send shipment notification email
   */
  private async sendShipmentNotificationEmail(
    order: any,
    trackingNumber: string,
    trackingUrl: string,
    estimatedDelivery: string,
  ) {
    try {
      // Email functionality disabled - would need to load user separately
      console.log(`[Email] Shipment created - Tracking #: ${trackingNumber}`);
      console.log(`[Email] URL: ${trackingUrl}`);
      console.log(`[Email] ETA: ${estimatedDelivery}`);
    } catch (error) {
      console.error(`[Email] Error in shipment notification: ${error}`);
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(trackingNumber: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      console.log(`[Shipment] Cancelling shipment: ${trackingNumber}`);

      // Cancel with F Ship
      const result = await fShipService.cancelShipment(trackingNumber);

      if (!result.success) {
        return result;
      }

      // Update database
      await db
        .update(shipments)
        .set({
          status: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(shipments.trackingNumber, trackingNumber));

      // Update order status
      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.trackingNumber, trackingNumber));

      if (shipment) {
        await db
          .update(orders)
          .set({
            status: "CANCELLED",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, shipment.orderId));
      }

      return { success: true, message: "Shipment cancelled successfully" };
    } catch (error: any) {
      console.error(`[Shipment] Error cancelling shipment: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

export const shipmentService = new ShipmentService();
