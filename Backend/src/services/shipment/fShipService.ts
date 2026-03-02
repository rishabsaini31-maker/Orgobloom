import axios from "axios";
import { logger } from "../../utils/logger.js";

interface FShipCreateShipmentPayload {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  order_items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  cod?: boolean;
  cod_amount?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

interface FShipShipmentResponse {
  success: boolean;
  message: string;
  data?: {
    shipment_id: string;
    order_id: string;
    tracking_number: string;
    tracking_url: string;
    carrier: string;
    estimated_delivery: string;
  };
  error?: string;
}

export class FShipService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.FSHIP_API_KEY || "";
    this.baseUrl = process.env.FSHIP_BASE_URL || "https://api.fship.in/api/v1";

    if (!this.apiKey) {
      logger.warn(
        "[FShip] API Key not configured. Shipment integration disabled."
      );
    }
  }

  /**
   * Check if F Ship is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Create a shipment with F Ship
   */
  async createShipment(
    payload: FShipCreateShipmentPayload
  ): Promise<FShipShipmentResponse> {
    if (!this.isConfigured()) {
      logger.error("[FShip] API Key not configured");
      return {
        success: false,
        error: "F Ship is not configured",
        message: "Shipment service temporarily unavailable",
      };
    }

    try {
      logger.info(`[FShip] Creating shipment for order: ${payload.order_id}`);

      const response = await axios.post(`${this.baseUrl}/shipments/create`, {
        api_key: this.apiKey,
        ...payload,
      });

      logger.info(
        `[FShip] Shipment created successfully: ${response.data.data?.shipment_id}`
      );

      return {
        success: true,
        message: "Shipment created successfully",
        data: {
          shipment_id: response.data.data.shipment_id,
          order_id: payload.order_id,
          tracking_number: response.data.data.tracking_number,
          tracking_url: response.data.data.tracking_url,
          carrier: response.data.data.carrier,
          estimated_delivery: response.data.data.estimated_delivery,
        },
      };
    } catch (error: any) {
      logger.error(
        `[FShip] Error creating shipment: ${error.message}`,
        error.response?.data
      );
      return {
        success: false,
        error: error.message,
        message: "Failed to create shipment",
      };
    }
  }

  /**
   * Get shipment tracking details
   */
  async getTrackingDetails(trackingNumber: string): Promise<{
    success: boolean;
    data?: {
      status: string;
      current_location: string;
      estimated_delivery: string;
      events: Array<{
        timestamp: string;
        status: string;
        location: string;
        message: string;
      }>;
    };
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "F Ship is not configured",
      };
    }

    try {
      logger.info(`[FShip] Fetching tracking details for: ${trackingNumber}`);

      const response = await axios.get(`${this.baseUrl}/shipments/track`, {
        params: {
          api_key: this.apiKey,
          tracking_number: trackingNumber,
        },
      });

      return {
        success: true,
        data: {
          status: response.data.data.status,
          current_location: response.data.data.current_location,
          estimated_delivery: response.data.data.estimated_delivery,
          events: response.data.data.tracking_events || [],
        },
      };
    } catch (error: any) {
      logger.error(
        `[FShip] Error fetching tracking details: ${error.message}`,
        error.response?.data
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(trackingNumber: string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: "F Ship is not configured",
      };
    }

    try {
      logger.info(`[FShip] Cancelling shipment: ${trackingNumber}`);

      const response = await axios.post(`${this.baseUrl}/shipments/cancel`, {
        api_key: this.apiKey,
        tracking_number: trackingNumber,
      });

      return {
        success: true,
        message: "Shipment cancelled successfully",
      };
    } catch (error: any) {
      logger.error(
        `[FShip] Error cancelling shipment: ${error.message}`,
        error.response?.data
      );
      return {
        success: false,
        message: "Failed to cancel shipment",
        error: error.message,
      };
    }
  }

  /**
   * Get shipment rates
   */
  async getShippingRates(
    pincode: string,
    weight: number,
    destination_state: string
  ): Promise<{
    success: boolean;
    data?: Array<{
      carrier: string;
      rate: number;
      estimated_delivery_days: number;
    }>;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "F Ship is not configured",
      };
    }

    try {
      logger.info(
        `[FShip] Fetching rates for pincode: ${pincode}, weight: ${weight}kg`
      );

      const response = await axios.get(`${this.baseUrl}/shipments/rates`, {
        params: {
          api_key: this.apiKey,
          pincode,
          weight,
          destination_state,
        },
      });

      return {
        success: true,
        data: response.data.data
          .map((rate: any) => ({
            carrier: rate.carrier,
            rate: rate.rate,
            estimated_delivery_days: rate.estimated_delivery_days,
          }))
          .sort(
            (a: any, b: any) => a.estimated_delivery_days - b.estimated_delivery_days
          ),
      };
    } catch (error: any) {
      logger.error(
        `[FShip] Error fetching rates: ${error.message}`,
        error.response?.data
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const fShipService = new FShipService();
