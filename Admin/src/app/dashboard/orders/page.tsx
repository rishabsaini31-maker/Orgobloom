"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export default function OrdersPage() {
  const [filter, setFilter] = useState<
    | "all"
    | "pending"
    | "processing"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "cancelled"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { token } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: ordersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders", filter, token],
    queryFn: () =>
      adminApi.getOrders({
        status: filter === "all" ? undefined : filter,
      }),
    enabled: mounted && !!token,
    refetchOnMount: true,
  });

  // Handle different API response formats
  // API returns { orders: [...], pagination: {...} }
  let orders: any[] = [];
  if (ordersData) {
    const responseData = ordersData.data || ordersData;
    if (responseData.orders && Array.isArray(responseData.orders)) {
      orders = responseData.orders;
    } else if (Array.isArray(responseData)) {
      orders = responseData;
    } else if (Array.isArray(responseData.data)) {
      orders = responseData.data;
    }
  }

  // Sort orders: cancelled orders should appear at the end
  const sortOrdersWithCancelledLast = (ordersList: any[]) => {
    return [...ordersList].sort((a, b) => {
      // If one is cancelled and the other isn't, non-cancelled comes first
      if (a.status === 'CANCELLED' && b.status !== 'CANCELLED') return 1;
      if (a.status !== 'CANCELLED' && b.status === 'CANCELLED') return -1;
      // If both have same status regarding cancellation, sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const filteredOrders = Array.isArray(orders)
    ? sortOrdersWithCancelledLast(
        orders.filter(
          (order: any) =>
            order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      )
    : [];

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, { status: newStatus });
      toast.success("Order status updated");
      refetch();
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const statusCounts = {
    pending: orders.filter((o: any) => o.status === "PENDING").length,
    processing: orders.filter((o: any) => o.status === "PROCESSING").length,
    confirmed: orders.filter((o: any) => o.status === "CONFIRMED").length,
    shipped: orders.filter((o: any) => o.status === "SHIPPED").length,
    delivered: orders.filter((o: any) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o: any) => o.status === "CANCELLED").length,
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      CONFIRMED: "bg-cyan-100 text-cyan-800",
      SHIPPED: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const statusOptions = [
    "PENDING",
    "PROCESSING",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Order Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Pending", count: statusCounts.pending, key: "pending" },
          {
            label: "Processing",
            count: statusCounts.processing,
            key: "processing",
          },
          {
            label: "Confirmed",
            count: statusCounts.confirmed,
            key: "confirmed",
          },
          { label: "Shipped", count: statusCounts.shipped, key: "shipped" },
          {
            label: "Delivered",
            count: statusCounts.delivered,
            key: "delivered",
          },
          {
            label: "Cancelled",
            count: statusCounts.cancelled,
            key: "cancelled",
          },
        ].map((stat) => (
          <div key={stat.key} className="stat-card">
            <h3 className="text-gray-600 text-xs mb-1">{stat.label}</h3>
            <p className="text-2xl font-bold text-primary-600">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto border-b border-gray-200">
        {(
          [
            "all",
            "pending",
            "processing",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled",
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-2 font-medium text-xs whitespace-nowrap transition border-b-2 ${
              filter === tab
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by order ID, email, or customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium mb-2">Error loading orders</p>
          <p className="text-red-600 text-sm mb-4">
            {error instanceof Error
              ? error.message
              : "Failed to fetch order data"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
          >
            Retry
          </button>
        </div>
      ) : !Array.isArray(orders) || orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {!Array.isArray(orders) ? "No data available" : "No orders found"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Order ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0, 50).map((order: any) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 text-xs text-gray-900 font-mono">
                    {order.id?.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {order.customerName || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {order.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {order.itemsCount || 0}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-900">
                    ₹{(order.total || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <select
                      value={order.status || "PENDING"}
                      onChange={(e) =>
                        handleStatusUpdate(order.id, e.target.value)
                      }
                      disabled={updatingId === order.id}
                      className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${getStatusColor(
                        order.status,
                      )}`}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <button
                      className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                      onClick={() => toast.success(`Order ${order.id} details`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length > 50 && (
            <div className="px-4 py-3 text-xs text-gray-600 bg-gray-50 border-t border-gray-200">
              Showing 50 of {filteredOrders.length} orders
            </div>
          )}
        </div>
      )}
    </div>
  );
}
