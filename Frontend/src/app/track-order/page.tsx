"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface TrackingInfo {
  orderNumber: string;
  status: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const statusColors: Record<
  string,
  { bg: string; text: string; progress: number }
> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", progress: 25 },
  processing: { bg: "bg-blue-100", text: "text-blue-800", progress: 50 },
  shipped: { bg: "bg-purple-100", text: "text-purple-800", progress: 75 },
  delivered: { bg: "bg-green-100", text: "text-green-800", progress: 100 },
  cancelled: { bg: "bg-red-100", text: "text-red-800", progress: 0 },
  confirmed: { bg: "bg-green-100", text: "text-green-800", progress: 50 },
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber.trim()) {
      toast.error("Please enter an order number");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const token = localStorage.getItem("token");
      let url = `${process.env.NEXT_PUBLIC_API_URL}/orders/track/${orderNumber}`;
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();
        setTracking(data.order);
      } else if (response.status === 404) {
        setTracking(null);
        toast.error("Order not found");
      } else {
        setTracking(null);
        toast.error("Failed to track order");
      }
    } catch (error) {
      console.error("Failed to track order:", error);
      setTracking(null);
      toast.error("Failed to track order");
    } finally {
      setLoading(false);
    }
  };

  const statusLower = tracking?.status.toLowerCase() || "";
  const statusInfo = statusColors[statusLower] || statusColors.pending;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Search Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Track Your Order
              </h1>
              <p className="text-gray-600 mb-6">
                Enter your order number to track its status
              </p>

              <form onSubmit={handleSearch} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter order number (e.g., ORD-2024-001)"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium px-8 py-3 rounded-lg transition-colors"
                >
                  {loading ? "Searching..." : "Track"}
                </button>
              </form>
            </div>
            {/* Results Section */}
            {searched && tracking && (
              <div className="space-y-6">
                {/* Status Card */}
                <div
                  className={`${statusInfo.bg} border border-gray-200 rounded-lg p-6`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {tracking.orderNumber}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Status Update
                      </p>
                    </div>
                    <span
                      className={`${statusInfo.bg} ${statusInfo.text} px-6 py-2 rounded-full font-semibold text-lg`}
                    >
                      {tracking.status.charAt(0).toUpperCase() +
                        tracking.status.slice(1)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 transition-all duration-500"
                        style={{ width: `${statusInfo.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>Pending</span>
                      <span>Processing</span>
                      <span>Shipped</span>
                      <span>Delivered</span>
                    </div>
                  </div>
                </div>

                {/* Tracking Number */}
                {tracking.trackingNumber && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                      TRACKING NUMBER
                    </h3>
                    <p className="text-2xl font-mono font-bold text-gray-900">
                      {tracking.trackingNumber}
                    </p>
                    {tracking.estimatedDelivery && (
                      <>
                        <h3 className="text-sm font-semibold text-gray-600 mt-4 mb-2">
                          ESTIMATED DELIVERY
                        </h3>
                        <p className="text-lg text-gray-900">
                          {tracking.estimatedDelivery}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Order Items */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {tracking.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-start pb-3 border-b border-gray-200 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.productName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Shipping To
                  </h3>
                  <div className="text-gray-700">
                    <p className="font-semibold">
                      {tracking.shippingAddress.name}
                    </p>
                    <p className="text-sm mt-2">
                      {tracking.shippingAddress.address}
                    </p>
                    <p className="text-sm">
                      {tracking.shippingAddress.city},{" "}
                      {tracking.shippingAddress.state}{" "}
                      {tracking.shippingAddress.pincode}
                    </p>
                  </div>
                </div>

                {/* View Full Details Link */}
                <Link
                  href="/orders"
                  className="text-primary-600 hover:text-primary-700 font-medium text-center py-3 block"
                >
                  ← Back to all orders
                </Link>
              </div>
            )}
            {/* Not Found State */}
            {searched && !tracking && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Order Not Found
                </h3>
                <p className="text-gray-600 mb-6">
                  We couldn't find an order with that number. Please check and
                  try again.
                </p>
                <button
                  onClick={() => {
                    setOrderNumber("");
                    setSearched(false);
                  }}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Search Again
                </button>
              </div>
            )}
            {/* Initial State */}
            {!searched && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Track Your Package
                </h3>
                <p className="text-gray-600">
                  Enter your order number above to see real-time tracking
                  updates
                </p>
              </div>
            )}{" "}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
