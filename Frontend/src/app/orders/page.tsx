"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: string;
  items: number;
}

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

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

  // Load orders on component mount
  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const {
    data: orders = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetchWithTimeout(
        `${process.env.NEXT_PUBLIC_API_URL}/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load orders");
      }

      const data = await response.json();
      return data.orders as Order[];
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const filteredOrders = useMemo(() => {
    if (selectedStatus === "all") {
      return orders;
    }

    return orders.filter((order) =>
      order.status.toLowerCase().includes(selectedStatus.toLowerCase()),
    );
  }, [orders, selectedStatus]);

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "bg-gray-100 text-gray-800",
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  My Orders
                </h1>
                <p className="text-gray-600">View and manage your orders</p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {[
                "all",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedStatus === status
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-primary-600"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {!token && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600 mb-4">
                  Please log in to view orders
                </p>
                <Link
                  href="/login"
                  className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Go to Login
                </Link>
              </div>
            )}

            {/* Loading State */}
            {token && (isLoading || isFetching) && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="text-gray-600 mt-4">Loading orders...</p>
              </div>
            )}

            {token && isError && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-700 mb-4">
                  {error instanceof Error
                    ? error.message
                    : "Unable to load orders"}
                </p>
                <button
                  onClick={() => refetch()}
                  className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Orders List */}
            {token && !isLoading && !isError && filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Order Number</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {order.orderNumber}
                        </p>
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Order Date</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-lg font-semibold text-primary-600">
                          ₹{order.total.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Items</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {order.items} item{order.items > 1 ? "s" : ""}
                        </p>
                      </div>

                      <div className="flex-1 flex items-end">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </div>

                      <Link
                        href={`/orders/${order.id}`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : token && !isLoading && !isError ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <p className="text-gray-600 mb-4">No orders found</p>
                <Link
                  href="/products"
                  className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
