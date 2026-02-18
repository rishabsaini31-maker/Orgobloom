"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  status: string;
  paymentStatus: string;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  const fetchWithTimeout = async (
    url: string,
    options: RequestInit,
    timeoutMs = 8000,
  ) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, [orderId, router]);

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order", orderId, token],
    enabled: Boolean(orderId && token),
    queryFn: async () => {
      const response = await fetchWithTimeout(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load order details");
      }

      const data = await response.json();
      return data.order as OrderDetails;
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      confirmed: "bg-green-100 text-green-800",
    };
    const lowerStatus = status.toLowerCase();
    return (
      statusMap[lowerStatus] ||
      (lowerStatus.includes("confirm")
        ? statusMap.confirmed
        : statusMap.pending)
    );
  };

  const getStatusSteps = () => {
    const steps = ["Pending", "Processing", "Shipped", "Delivered"];
    const statusMap: Record<string, number> = {
      pending: 0,
      processing: 1,
      shipped: 2,
      delivered: 3,
      confirmed: 1,
      cancelled: -1,
    };
    return statusMap[order?.status.toLowerCase() || ""] || 0;
  };

  if (!token) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-600 mb-4">
              Please log in to view this order
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading order details...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-700 mb-4">
              {error instanceof Error
                ? error.message
                : "Unable to load order details"}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-600 mb-4">Order not found</p>
            <Link href="/orders" className="text-primary-600 hover:underline">
              Back to Orders
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const currentStep = getStatusSteps();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors mb-6"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            {/* Order Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Order {order.orderNumber}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      order.paymentStatus === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    Payment: {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Order Timeline */}
              {order.status !== "CANCELLED" && (
                <div className="my-8">
                  <div className="flex justify-between items-center">
                    {["Pending", "Processing", "Shipped", "Delivered"].map(
                      (step, idx) => (
                        <div
                          key={step}
                          className="flex flex-col items-center flex-1"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              idx <= currentStep
                                ? "bg-primary-600"
                                : "bg-gray-300"
                            }`}
                          >
                            {idx < currentStep ? "✓" : idx + 1}
                          </div>
                          <p className="text-sm mt-2 text-gray-600">{step}</p>
                        </div>
                      ),
                    )}
                  </div>
                  <div className="flex mt-3">
                    {["", "", ""].map((_, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 h-1 mx-1 ${idx < currentStep ? "bg-primary-600" : "bg-gray-300"}`}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tracking Info */}
            {order.trackingNumber && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-bold text-blue-900 mb-4">
                  Tracking Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">
                      Tracking Number
                    </p>
                    <p className="text-lg font-mono text-blue-900">
                      {order.trackingNumber}
                    </p>
                  </div>
                  {order.estimatedDelivery && (
                    <div>
                      <p className="text-sm text-blue-700 font-medium">
                        Estimated Delivery
                      </p>
                      <p className="text-lg text-blue-900">
                        {order.estimatedDelivery}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Order Items
              </h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 pb-4 border-b border-gray-200 last:border-0"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm font-medium text-primary-600">
                        ₹{item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Shipping Address
              </h2>
              <div className="text-gray-700">
                <p className="font-semibold">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.pincode}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Phone: {order.shippingAddress.phone}
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax</span>
                  <span>₹{order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span>₹{order.shippingCost.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-primary-600">
                    ₹{order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
