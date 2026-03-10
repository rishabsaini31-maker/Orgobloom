import axios from "axios";

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
      console.warn(
        "[FShip] API Key not configured. Shipment integration disabled.",
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
    payload: FShipCreateShipmentPayload,
  ): Promise<FShipShipmentResponse> {
    if (!this.isConfigured()) {
      console.error("[FShip] API Key not configured");
      return {
        success: false,
        error: "F Ship is not configured",
        message: "Shipment service temporarily unavailable",
      };
    }

    try {
      console.log(`[FShip] Creating shipment for order: ${payload.order_id}`);
      console.log(`[FShip] API Base URL: ${this.baseUrl}`);
      console.log(`[FShip] Using API Key: ${this.apiKey.substring(0, 8)}...`);
      console.log(`[FShip] Payload:`, JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${this.baseUrl}/shipments/create`,
        payload,
        {
          headers: {
            "X-API-KEY": this.apiKey,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      console.log(
        `[FShip] Shipment created successfully: ${response.data.data?.shipment_id}`,
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
      console.error(`[FShip] ❌ Error creating shipment:`);
      console.error(`[FShip] Status Code: ${error.response?.status}`);
      console.error(`[FShip] Error Message: ${error.response?.statusText}`);
      console.error(`[FShip] Error Data:`, error.response?.data);
      console.error(`[FShip] Full Error:`, error.message);

      // Specific error handling for 401
      if (error.response?.status === 401) {
        console.error(`[FShip] ⚠️  AUTHENTICATION FAILED - Check your API key`);
        console.error(`[FShip] Please verify:`);
        console.error(`[FShip]   - API key is valid and not expired`);
        console.error(`[FShip]   - API key has correct permissions`);
        console.error(
          `[FShip]   - Environment variable FSHIP_API_KEY is set correctly`,
        );
      }

      return {
        success: false,
        error: error.message,
        message: `Failed to create shipment: ${error.response?.data?.message || error.message}`,
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
      console.log(`[FShip] Fetching tracking details for: ${trackingNumber}`);

      const response = await axios.get(`${this.baseUrl}/shipments/track`, {
        params: {
          tracking_number: trackingNumber,
        },
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        timeout: 10000,
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
      console.error(
        `[FShip] Error fetching tracking details: ${error.message}`,
        error.response?.data,
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
      console.log(`[FShip] Cancelling shipment: ${trackingNumber}`);

      const response = await axios.post(
        `${this.baseUrl}/shipments/cancel`,
        {
          tracking_number: trackingNumber,
        },
        {
          headers: {
            "X-API-KEY": this.apiKey,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      return {
        success: true,
        message: "Shipment cancelled successfully",
      };
    } catch (error: any) {
      console.error(
        `[FShip] Error cancelling shipment: ${error.message}`,
        error.response?.data,
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
    destination_state: string,
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
      console.log(
        `[FShip] Fetching rates for pincode: ${pincode}, weight: ${weight}kg`,
      );

      const response = await axios.get(`${this.baseUrl}/shipments/rates`, {
        params: {
          pincode,
          weight,
          destination_state,
        },
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        timeout: 10000,
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
            (a: any, b: any) =>
              a.estimated_delivery_days - b.estimated_delivery_days,
          ),
      };
    } catch (error: any) {
      console.error(
        `[FShip] Error fetching rates: ${error.message}`,
        error.response?.data,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const fShipService = new FShipService();
