/**
 * Fship Shipping Service
 *
 * Fship is a shipping aggregator that provides courier services in India.
 * Documentation: https://fship.in/docs
 */

import { ApiError } from "../middleware/errorHandler";

// Fship API configuration
const FSHIP_BASE_URL =
  process.env.FSHIP_MODE === "production"
    ? "https://api.fship.in/v1"
    : "https://sandbox-api.fship.in/v1";

// Types
interface FshipAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

interface FshipPackage {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_state: string;
  customer_pincode: string;
  customer_country?: string;
  product_name: string;
  product_quantity: number;
  product_price: number;
  weight: number; // in kg
  length?: number; // in cm
  breadth?: number; // in cm
  height?: number; // in cm
  cod_amount?: number; // for COD orders
  payment_type: "PREPAID" | "COD";
  courier_id?: string; // specific courier preference
}

interface FshipShipmentResponse {
  success: boolean;
  shipment_id: string;
  awb_code: string;
  courier_name: string;
  courier_id: string;
  status: string;
  message?: string;
}

interface FshipTrackingResponse {
  success: boolean;
  shipment_id: string;
  awb_code: string;
  status: string;
  status_code: string;
  current_location?: string;
  scans: Array<{
    status: string;
    status_code: string;
    location: string;
    message: string;
    timestamp: string;
  }>;
}

interface FshipServiceabilityResponse {
  success: boolean;
  courier_partners: Array<{
    courier_id: string;
    courier_name: string;
    rate: number;
    estimated_days: number;
    cod_available: boolean;
    prepaid_available: boolean;
  }>;
}

// Fship Service Class
class FshipService {
  private apiKey: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.apiKey = process.env.FSHIP_API_KEY || "";
    this.clientId = process.env.FSHIP_CLIENT_ID || "";
    this.clientSecret = process.env.FSHIP_CLIENT_SECRET || "";
  }

  // Check if Fship is configured
  isConfigured(): boolean {
    return !!(this.apiKey && this.clientId && this.clientSecret);
  }

  // Get headers for API calls
  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "X-Client-Id": this.clientId,
      "X-Client-Secret": this.clientSecret,
    };
  }

  // Make API request
  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: any,
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new ApiError("Fship credentials not configured", 503);
    }

    try {
      const response = await fetch(`${FSHIP_BASE_URL}${endpoint}`, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        throw new ApiError(
          data?.message || `Fship API error: ${response.status}`,
          response.status,
        );
      }

      return data as T;
    } catch (error: any) {
      console.error("Fship API error:", error);
      throw error;
    }
  }

  // Check serviceability
  async checkServiceability(
    pickupPincode: string,
    deliveryPincode: string,
    weight: number,
    codAmount?: number,
  ): Promise<FshipServiceabilityResponse> {
    return this.makeRequest<FshipServiceabilityResponse>(
      "/serviceability",
      "POST",
      {
        pickup_pincode: pickupPincode,
        delivery_pincode: deliveryPincode,
        weight,
        cod_amount: codAmount,
      },
    );
  }

  // Create shipment
  async createShipment(
    packageData: FshipPackage,
  ): Promise<FshipShipmentResponse> {
    return this.makeRequest<FshipShipmentResponse>(
      "/shipments/create",
      "POST",
      {
        order_id: packageData.order_id,
        customer: {
          name: packageData.customer_name,
          phone: packageData.customer_phone,
          address: packageData.customer_address,
          city: packageData.customer_city,
          state: packageData.customer_state,
          pincode: packageData.customer_pincode,
          country: packageData.customer_country || "India",
        },
        product: {
          name: packageData.product_name,
          quantity: packageData.product_quantity,
          price: packageData.product_price,
        },
        package: {
          weight: packageData.weight,
          length: packageData.length || 20,
          breadth: packageData.breadth || 15,
          height: packageData.height || 10,
        },
        payment: {
          type: packageData.payment_type,
          cod_amount: packageData.cod_amount,
        },
        courier_id: packageData.courier_id,
      },
    );
  }

  // Track shipment
  async trackShipment(awbCode: string): Promise<FshipTrackingResponse> {
    return this.makeRequest<FshipTrackingResponse>(
      `/shipments/track/${awbCode}`,
      "GET",
    );
  }

  // Cancel shipment
  async cancelShipment(
    shipmentId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(
      `/shipments/${shipmentId}/cancel`,
      "POST",
    );
  }

  // Get shipment details
  async getShipmentDetails(shipmentId: string): Promise<any> {
    return this.makeRequest<any>(`/shipments/${shipmentId}`, "GET");
  }

  // Generate manifest
  async generateManifest(
    shipmentIds: string[],
  ): Promise<{ manifest_url: string }> {
    return this.makeRequest<{ manifest_url: string }>(
      "/shipments/manifest",
      "POST",
      { shipment_ids: shipmentIds },
    );
  }

  // Generate label
  async generateLabel(shipmentId: string): Promise<{ label_url: string }> {
    return this.makeRequest<{ label_url: string }>(
      `/shipments/${shipmentId}/label`,
      "GET",
    );
  }

  // Get courier list
  async getCourierList(): Promise<
    Array<{ id: string; name: string; logo: string }>
  > {
    return this.makeRequest<Array<{ id: string; name: string; logo: string }>>(
      "/couriers",
      "GET",
    );
  }

  // Calculate shipping rate
  async calculateRate(
    pickupPincode: string,
    deliveryPincode: string,
    weight: number,
    codAmount?: number,
  ): Promise<{
    courier_name: string;
    courier_id: string;
    rate: number;
    cod_charges: number;
    estimated_days: number;
  }> {
    const serviceability = await this.checkServiceability(
      pickupPincode,
      deliveryPincode,
      weight,
      codAmount,
    );

    if (
      !serviceability.success ||
      serviceability.courier_partners.length === 0
    ) {
      throw new ApiError("No courier service available for this route", 400);
    }

    // Return the cheapest option
    const cheapest = serviceability.courier_partners.sort(
      (a, b) => a.rate - b.rate,
    )[0];

    return {
      courier_name: cheapest.courier_name,
      courier_id: cheapest.courier_id,
      rate: cheapest.rate,
      cod_charges:
        codAmount && cheapest.cod_available ? cheapest.rate * 0.02 : 0,
      estimated_days: cheapest.estimated_days,
    };
  }
}

// Export singleton instance
const fshipService = new FshipService();
export default fshipService;

// Export types
export type {
  FshipAddress,
  FshipPackage,
  FshipShipmentResponse,
  FshipTrackingResponse,
  FshipServiceabilityResponse,
};
