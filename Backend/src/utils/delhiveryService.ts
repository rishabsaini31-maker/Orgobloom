import { ApiError } from "../middleware/errorHandler";

// Delhivery API configuration
const DELHIVERY_BASE_URL =
  process.env.DELHIVERY_MODE === "production"
    ? "https://track.delhivery.com/api"
    : "https://track.delhivery.com/api"; // Same URL, different credentials

const DELHIVERY_CLIENT_ID = process.env.DELHIVERY_CLIENT_ID;
const DELHIVERY_CLIENT_SECRET = process.env.DELHIVERY_CLIENT_SECRET;

// Delhivery API Types
interface DelhiveryAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
}

interface DelhiveryPackage {
  order: string;
  phone: string;
  product: string;
  cod_amount?: number;
  payment_mode: "COD" | "Prepaid";
  name: string;
  add: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  quantity: number;
  weight: number;
  length?: number;
  breadth?: number;
  height?: number;
  return_add?: string;
  return_city?: string;
  return_state?: string;
  return_country?: string;
  return_pin?: string;
  return_phone?: string;
  return_name?: string;
}

interface TrackingResponse {
  ShipmentData: Array<{
    Shipment: {
      Origin: string;
      Destination: string;
      Status: {
        Status: string;
        StatusLocation: string;
        StatusDateTime: string;
        Instructions: string;
        StatusType: string;
      };
      Consignee: {
        Name: string;
        City: string;
        Country: string;
        PinCode: string;
        State: string;
      };
      OrderType: string;
      ReferenceNo: string;
      AWB: string;
      Courier: string;
      PickUpDate: string;
      DispatchDate: string;
      DeliveredDate?: string;
      ExpectedDeliveryDate?: string;
      Scans: Array<{
        ScanDetail: {
          Scan: string;
          ScanType: string;
          ScanDateTime: string;
          ScannedLocation: string;
          Instructions: string;
        };
      }>;
    };
  }>;
}

// Get authorization header
const getAuthHeaders = (): Record<string, string> => {
  if (!DELHIVERY_CLIENT_ID || !DELHIVERY_CLIENT_SECRET) {
    throw new ApiError(
      "Delhivery credentials not configured. Please set DELHIVERY_CLIENT_ID and DELHIVERY_CLIENT_SECRET environment variables.",
      503,
    );
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Token ${DELHIVERY_CLIENT_SECRET}`,
  };
};

// Create shipment/order in Delhivery
export const createDelhiveryShipment = async (
  packages: DelhiveryPackage[],
): Promise<{
  success: boolean;
  upload_wbn: string;
  packages: Array<{
    waybill: string;
    refnum: string;
    status: string;
  }>;
}> => {
  const headers = getAuthHeaders();

  const response = await fetch(`${DELHIVERY_BASE_URL}/backend/createorder/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      format: "json",
      data: packages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Delhivery shipment creation error:", error);
    throw new ApiError("Failed to create Delhivery shipment", 500);
  }

  const result = (await response.json()) as {
    success: boolean;
    upload_wbn: string;
    packages: Array<{
      waybill: string;
      refnum: string;
      status: string;
    }>;
  };

  return result;
};

// Track shipment by AWB number
export const trackShipment = async (
  awbNumber: string,
): Promise<TrackingResponse> => {
  const headers = getAuthHeaders();

  const response = await fetch(
    `${DELHIVERY_BASE_URL}/v1/packages/json/?waybill=${awbNumber}`,
    {
      method: "GET",
      headers,
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Delhivery tracking error:", error);
    throw new ApiError("Failed to track shipment", 500);
  }

  return (await response.json()) as TrackingResponse;
};

// Track shipment by order reference number
export const trackShipmentByRef = async (
  refNumber: string,
): Promise<TrackingResponse> => {
  const headers = getAuthHeaders();

  const response = await fetch(
    `${DELHIVERY_BASE_URL}/v1/packages/json/?ref_ids=${refNumber}`,
    {
      method: "GET",
      headers,
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Delhivery tracking error:", error);
    throw new ApiError("Failed to track shipment", 500);
  }

  return (await response.json()) as TrackingResponse;
};

// Cancel shipment
export const cancelShipment = async (
  awbNumbers: string[],
): Promise<{
  success: boolean;
  message: string;
}> => {
  const headers = getAuthHeaders();

  const response = await fetch(`${DELHIVERY_BASE_URL}/p/edit/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      waybill: awbNumbers.join(","),
      cancellation: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Delhivery cancellation error:", error);
    throw new ApiError("Failed to cancel shipment", 500);
  }

  const result = (await response.json()) as {
    status?: string;
    message?: string;
  };

  return {
    success: true,
    message: result.message || "Shipment cancelled successfully",
  };
};

// Check pincode serviceability
export const checkServiceability = async (
  pickupPincode: string,
  deliveryPincode: string,
  weight: number,
  cod?: number,
): Promise<{
  available: boolean;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estimatedDays: number;
  rate: number;
}> => {
  const headers = getAuthHeaders();

  let url = `${DELHIVERY_BASE_URL}/c/api/pin-codes/json/?filter_codes=${deliveryPincode}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Delhivery serviceability check error:", error);
    throw new ApiError("Failed to check serviceability", 500);
  }

  const result = (await response.json()) as {
    delivery_codes: Array<{
      postal_code: {
        pin: string;
        cod: string;
        prepaid: string;
        estimated_delivery_days: number;
      };
    }>;
  };

  const pincodeData = result.delivery_codes?.[0]?.postal_code;

  if (!pincodeData) {
    return {
      available: false,
      codAvailable: false,
      prepaidAvailable: false,
      estimatedDays: 0,
      rate: 0,
    };
  }

  return {
    available: true,
    codAvailable: pincodeData.cod === "Y",
    prepaidAvailable: pincodeData.prepaid === "Y",
    estimatedDays: pincodeData.estimated_delivery_days || 3,
    rate: 0, // Rate calculation requires separate API call
  };
};

// Request pickup
export const requestPickup = async (
  pickupDate: string,
  pickupTime: string,
  packages: Array<{
    waybill: string;
    client: string;
    product: string;
    count: number;
  }>,
): Promise<{
  success: boolean;
  pickupId: string;
}> => {
  const headers = getAuthHeaders();

  const response = await fetch(`${DELHIVERY_BASE_URL}/fm/request/new/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      pickup_location: {
        name: process.env.DELHIVERY_PICKUP_NAME || "Orgobloom",
        city: process.env.DELHIVERY_PICKUP_CITY || "",
        pin_code: process.env.DELHIVERY_PICKUP_PINCODE || "",
        phone: process.env.DELHIVERY_PICKUP_PHONE || "",
        address: process.env.DELHIVERY_PICKUP_ADDRESS || "",
      },
      packages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Delhivery pickup request error:", error);
    throw new ApiError("Failed to request pickup", 500);
  }

  const result = (await response.json()) as {
    upload_id?: string;
    pickup_id?: string;
  };

  return {
    success: true,
    pickupId: result.pickup_id || result.upload_id || "",
  };
};

// Generate manifest
export const generateManifest = async (
  waybills: string[],
): Promise<{
  success: boolean;
  manifestUrl: string;
}> => {
  const headers = getAuthHeaders();

  const response = await fetch(`${DELHIVERY_BASE_URL}/api/p/push_manifest/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      waybills: waybills.join(","),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Delhivery manifest generation error:", error);
    throw new ApiError("Failed to generate manifest", 500);
  }

  const result = (await response.json()) as { manifest_url?: string };

  return {
    success: true,
    manifestUrl: result.manifest_url || "",
  };
};

// Get shipping label
export const getShippingLabel = async (waybill: string): Promise<string> => {
  const headers = getAuthHeaders();

  const response = await fetch(
    `${DELHIVERY_BASE_URL}/api/p/push_label/${waybill}/`,
    {
      method: "GET",
      headers,
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Delhivery label generation error:", error);
    throw new ApiError("Failed to generate shipping label", 500);
  }

  return await response.text();
};

// Create return order
export const createReturnOrder = async (returnData: {
  order: string;
  phone: string;
  product: string;
  name: string;
  add: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  quantity: number;
  weight: number;
  return_add: string;
  return_city: string;
  return_state: string;
  return_country: string;
  return_pin: string;
  return_phone: string;
  return_name: string;
}): Promise<{
  success: boolean;
  waybill: string;
}> => {
  const headers = getAuthHeaders();

  const response = await fetch(`${DELHIVERY_BASE_URL}/backend/createorder/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      format: "json",
      data: [
        {
          ...returnData,
          payment_mode: "Pickup",
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Delhivery return order creation error:", error);
    throw new ApiError("Failed to create return order", 500);
  }

  const result = (await response.json()) as {
    success: boolean;
    packages: Array<{ waybill: string }>;
  };

  return {
    success: true,
    waybill: result.packages?.[0]?.waybill || "",
  };
};

// Get all pickup locations
export const getPickupLocations = async (): Promise<
  Array<{
    name: string;
    city: string;
    pin_code: string;
    phone: string;
    address: string;
  }>
> => {
  const headers = getAuthHeaders();

  const response = await fetch(`${DELHIVERY_BASE_URL}/api/pickup/list/`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Delhivery pickup locations error:", error);
    throw new ApiError("Failed to get pickup locations", 500);
  }

  const result = (await response.json()) as {
    data: Array<{
      name: string;
      city: string;
      pin_code: string;
      phone: string;
      address: string;
    }>;
  };

  return result.data || [];
};

export default {
  createDelhiveryShipment,
  trackShipment,
  trackShipmentByRef,
  cancelShipment,
  checkServiceability,
  requestPickup,
  generateManifest,
  getShippingLabel,
  createReturnOrder,
  getPickupLocations,
};
