import { ApiError } from "@/middleware/errorHandler";

// Shiprocket API configuration
const SHIPROCKET_BASE_URL =
  process.env.SHIPROCKET_MODE === "production"
    ? "https://apiv2.shiprocket.in"
    : "https://apiv2.shiprocket.in"; // Same URL, different credentials

let shiprocketToken: string | null = null;
let tokenExpiry: number | null = null;

// Shiprocket API Types
interface ShiprocketAddress {
  name: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  email?: string;
}

interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}

interface ShiprocketOrder {
  order_id: string;
  order_date: string;
  pickup_location?: string;
  billing_address: ShiprocketAddress;
  shipping_address: ShiprocketAddress;
  order_items: ShiprocketOrderItem[];
  payment_method: string;
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight: number;
}

interface TrackingResponse {
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
  current_status: string;
  current_status_id: number;
  current_status_updated_at: string;
  etd: string;
  shipments: Array<{
    awb: string;
    courier: string;
    courier_company_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    delivered_at?: string;
  }>;
  tracking_data: {
    track_url: string;
    shipment_track: Array<{
      id: number;
      awb: string;
      courier_id: number;
      status: string;
      status_code: number;
      current_location: string;
      remarks: string;
      timestamp: string;
    }>;
    shipment_track_activities: Array<{
      date: string;
      time: string;
      location: string;
      activity: string;
      status: string;
      status_code: number;
    }>;
  };
}

// Get Shiprocket authentication token
export const getShiprocketToken = async (): Promise<string> => {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new ApiError(
      "Shiprocket credentials not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD environment variables.",
      503,
    );
  }

  // Check if we have a valid cached token
  if (shiprocketToken && tokenExpiry && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }

  try {
    const response = await fetch(
      `${SHIPROCKET_BASE_URL}/v1/external/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Shiprocket auth error:", error);
      throw new ApiError("Failed to authenticate with Shiprocket", 500);
    }

    const data = (await response.json()) as { token: string };
    shiprocketToken = data.token;
    // Token expires in 24 hours, refresh 1 hour before
    tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

    return shiprocketToken;
  } catch (error) {
    console.error("Shiprocket authentication failed:", error);
    throw error;
  }
};

// Create Shiprocket Order
export const createShiprocketOrder = async (
  orderData: ShiprocketOrder,
): Promise<{
  orderId: string;
  shipmentId: string;
  awbCode?: string;
  courierName?: string;
}> => {
  const token = await getShiprocketToken();

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/v1/external/orders/create/adhoc`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    console.error("Shiprocket order creation error:", error);
    throw new ApiError(
      error.message || "Failed to create Shiprocket order",
      500,
    );
  }

  const result = (await response.json()) as {
    order_id: string;
    shipment_id: string;
    awb_code?: string;
    courier_company_name?: string;
  };

  return {
    orderId: result.order_id,
    shipmentId: result.shipment_id,
    awbCode: result.awb_code,
    courierName: result.courier_company_name,
  };
};

// Generate AWB (Air Waybill) for shipment
export const generateAWB = async (
  shipmentId: string,
  courierId?: string,
): Promise<{
  awbCode: string;
  courierName: string;
}> => {
  const token = await getShiprocketToken();

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/v1/external/courier/assign/awb`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: shipmentId,
        courier_id: courierId,
      }),
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    console.error("Shiprocket AWB generation error:", error);
    throw new ApiError(error.message || "Failed to generate AWB", 500);
  }

  const result = (await response.json()) as {
    awb_code: string;
    courier_company_name: string;
  };

  return {
    awbCode: result.awb_code,
    courierName: result.courier_company_name,
  };
};

// Request pickup for shipment
export const requestPickup = async (
  shipmentId: string,
): Promise<{
  pickupStatus: string;
  pickupScheduledDate?: string;
}> => {
  const token = await getShiprocketToken();

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/v1/external/courier/generate/pickup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: [shipmentId],
      }),
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    console.error("Shiprocket pickup request error:", error);
    throw new ApiError(error.message || "Failed to request pickup", 500);
  }

  const result = (await response.json()) as {
    pickup_status: string;
    pickup_scheduled_date?: string;
  };

  return {
    pickupStatus: result.pickup_status,
    pickupScheduledDate: result.pickup_scheduled_date,
  };
};

// Track shipment by AWB code
export const trackShipment = async (
  awbCode: string,
): Promise<TrackingResponse> => {
  const token = await getShiprocketToken();

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/v1/external/courier/track/awb/${awbCode}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    console.error("Shiprocket tracking error:", error);
    throw new ApiError(error.message || "Failed to track shipment", 500);
  }

  return (await response.json()) as TrackingResponse;
};

// Track shipment by order ID
export const trackShipmentByOrderId = async (
  orderId: string,
): Promise<TrackingResponse> => {
  const token = await getShiprocketToken();

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/v1/external/courier/track/order/${orderId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    console.error("Shiprocket tracking error:", error);
    throw new ApiError(error.message || "Failed to track shipment", 500);
  }

  return (await response.json()) as TrackingResponse;
};

// Cancel shipment
export const cancelShipment = async (
  awbCodes: string[],
): Promise<{
  success: boolean;
  message: string;
}> => {
  const token = await getShiprocketToken();

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/v1/external/orders/cancel/awb`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        awbs: awbCodes.join(","),
      }),
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    console.error("Shiprocket cancellation error:", error);
    throw new ApiError(error.message || "Failed to cancel shipment", 500);
  }

  const result = (await response.json()) as { message?: string };

  return {
    success: true,
    message: result.message || "Shipment cancelled successfully",
  };
};

// Get serviceability check
export const checkServiceability = async (
  pickupPincode: string,
  deliveryPincode: string,
  weight: number,
  cod?: number,
): Promise<{
  available: boolean;
  couriers: Array<{
    courier_id: number;
    courier_name: string;
    rate: number;
  }>;
}> => {
  const token = await getShiprocketToken();

  let url = `${SHIPROCKET_BASE_URL}/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}`;

  if (cod) {
    url += `&cod=${cod}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    console.error("Shiprocket serviceability check error:", error);
    throw new ApiError(error.message || "Failed to check serviceability", 500);
  }

  const result = (await response.json()) as {
    data: {
      available: boolean;
      courier_company: Array<{
        courier_id: number;
        courier_name: string;
        rate: number;
      }>;
    };
  };

  return {
    available: result.data.available,
    couriers: result.data.courier_company,
  };
};

// Get all pickup locations
export const getPickupLocations = async (): Promise<
  Array<{
    id: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pin_code: string;
  }>
> => {
  const token = await getShiprocketToken();

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/v1/external/settings/company/pickup`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    console.error("Shiprocket pickup locations error:", error);
    throw new ApiError(error.message || "Failed to get pickup locations", 500);
  }

  const result = (await response.json()) as {
    data: {
      shipping_address: Array<{
        id: string;
        name: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        pin_code: string;
      }>;
    };
  };

  return result.data.shipping_address;
};

// Create return order
export const createReturnOrder = async (orderData: {
  order_id: string;
  order_date: string;
  pickup_customer_name: string;
  pickup_address: string;
  pickup_city: string;
  pickup_state: string;
  pickup_country: string;
  pickup_pincode: string;
  pickup_phone: string;
  shipping_customer_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_pincode: string;
  shipping_phone: string;
  order_items: ShiprocketOrderItem[];
  payment_method: string;
  sub_total: number;
  weight: number;
}): Promise<{
  orderId: string;
  shipmentId: string;
}> => {
  const token = await getShiprocketToken();

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/v1/external/orders/create/return`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    console.error("Shiprocket return order creation error:", error);
    throw new ApiError(error.message || "Failed to create return order", 500);
  }

  const result = (await response.json()) as {
    order_id: string;
    shipment_id: string;
  };

  return {
    orderId: result.order_id,
    shipmentId: result.shipment_id,
  };
};

export default {
  getShiprocketToken,
  createShiprocketOrder,
  generateAWB,
  requestPickup,
  trackShipment,
  trackShipmentByOrderId,
  cancelShipment,
  checkServiceability,
  getPickupLocations,
  createReturnOrder,
};
