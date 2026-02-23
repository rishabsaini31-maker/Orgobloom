"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  AlertCircle,
} from "lucide-react";

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
  statusCode?: string;
}

interface Shipment {
  id: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  status: string;
  trackingEvents: TrackingEvent[];
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface ShipmentTrackingProps {
  orderId: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: any; step: number }
> = {
  PENDING: { label: "Pending", color: "bg-yellow-500", icon: Clock, step: 1 },
  PICKED_UP: {
    label: "Picked Up",
    color: "bg-blue-500",
    icon: Package,
    step: 2,
  },
  IN_TRANSIT: {
    label: "In Transit",
    color: "bg-blue-600",
    icon: Truck,
    step: 3,
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    color: "bg-purple-500",
    icon: Truck,
    step: 4,
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-green-500",
    icon: CheckCircle,
    step: 5,
  },
  FAILED: { label: "Failed", color: "bg-red-500", icon: AlertCircle, step: -1 },
  RETURNED: {
    label: "Returned",
    color: "bg-orange-500",
    icon: Package,
    step: -1,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-500",
    icon: AlertCircle,
    step: -1,
  },
};

const TIMELINE_STEPS = [
  { key: "PENDING", label: "Order Placed" },
  { key: "PICKED_UP", label: "Picked Up" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

export default function ShipmentTracking({ orderId }: ShipmentTrackingProps) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    fetchShipment();
  }, [orderId]);

  const fetchShipment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${apiUrl}/shipments/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShipment(response.data.shipment);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError("Failed to load shipment details");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Shipment information not available yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Check back later for tracking updates
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const currentStatus = STATUS_CONFIG[shipment.status] || STATUS_CONFIG.PENDING;
  const currentStep = currentStatus.step;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Shipment Tracking
          </h3>
          <p className="text-sm text-gray-600">
            {shipment.carrier} - {shipment.trackingNumber}
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-white text-sm font-medium ${currentStatus.color}`}
        >
          {currentStatus.label}
        </div>
      </div>

      {/* Timeline Progress Bar */}
      {currentStep > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${((currentStep - 1) / (TIMELINE_STEPS.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Steps */}
            {TIMELINE_STEPS.map((step, index) => {
              const stepConfig = STATUS_CONFIG[step.key];
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep - 1;
              const Icon = stepConfig.icon;

              return (
                <div
                  key={step.key}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                          ? "bg-blue-500 text-white ring-4 ring-blue-100"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${
                      isCompleted || isCurrent
                        ? "text-gray-900 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estimated Delivery */}
      {shipment.estimatedDelivery && shipment.status !== "DELIVERED" && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-700">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Estimated Delivery:</span>
            <span>
              {new Date(shipment.estimatedDelivery).toLocaleDateString(
                "en-IN",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                },
              )}
            </span>
          </div>
        </div>
      )}

      {/* Delivered On */}
      {shipment.deliveredAt && (
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Delivered on:</span>
            <span>
              {new Date(shipment.deliveredAt).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      )}

      {/* Tracking Events */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">
          Tracking History
        </h4>
        <div className="space-y-4">
          {shipment.trackingEvents?.map((event, index) => {
            const eventConfig =
              STATUS_CONFIG[event.status] || STATUS_CONFIG.PENDING;
            const Icon = eventConfig.icon;

            return (
              <div key={event.id} className="flex gap-4">
                {/* Icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${eventConfig.color} text-white`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {index < shipment.trackingEvents.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {event.description}
                      </p>
                      {event.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* External Tracking Link */}
      {shipment.trackingUrl && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a
            href={shipment.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Track on {shipment.carrier} website
          </a>
        </div>
      )}
    </div>
  );
}

// External link icon
function ExternalLink({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
