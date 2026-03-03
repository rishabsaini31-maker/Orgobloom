"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { OrderCardList } from "@/components/OrderCard";
import { useMediaQuery } from "@/hooks/useResponsive";
import OrdersDataTable from "@/components/OrdersDataTable";
import PermissionGate from "@/components/PermissionGate";
import { exportOrdersToCsv } from "@/utils/csvExport";

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
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const { token } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const { isMobile, isTablet } = useMediaQuery();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Prevent body scroll when select dropdown is open on mobile
    const handleSelectFocus = (e: Event) => {
      if ((e.target as HTMLSelectElement).tagName === "SELECT") {
        document.body.style.overflow = "hidden";
      }
    };

    const handleSelectBlur = (e: Event) => {
      if ((e.target as HTMLSelectElement).tagName === "SELECT") {
        document.body.style.overflow = "";
      }
    };

    document.addEventListener("focus", handleSelectFocus, true);
    document.addEventListener("blur", handleSelectBlur, true);

    return () => {
      document.removeEventListener("focus", handleSelectFocus, true);
      document.removeEventListener("blur", handleSelectBlur, true);
      document.body.style.overflow = "";
    };
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
        status: filter === "all" ? undefined : filter.toUpperCase(),
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
      if (a.status === "CANCELLED" && b.status !== "CANCELLED") return 1;
      if (a.status !== "CANCELLED" && b.status === "CANCELLED") return -1;
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
            order.customerName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()),
        ),
      )
    : [];

  const toggleOrderSelection = (orderId: string) => {
    console.log("Toggle order selection:", orderId);
    console.log("Current selected IDs:", selectedOrderIds);
    setSelectedOrderIds((previous) => {
      const updated = previous.includes(orderId)
        ? previous.filter((id) => id !== orderId)
        : [...previous, orderId];
      console.log("Updated selected IDs:", updated);
      return updated;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    console.log("Toggle select all:", checked);
    if (checked) {
      const allIds = filteredOrders.slice(0, 50).map((order: any) => order.id);
      console.log("Selecting all:", allIds);
      setSelectedOrderIds(allIds);
      return;
    }
    console.log("Deselecting all");
    setSelectedOrderIds([]);
  };

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

  const handleViewOrder = async (orderId: string) => {
    if (!orderId) {
      console.error("Invalid order ID passed to handleViewOrder");
      toast.error("Invalid order ID");
      return;
    }

    console.log("=== View Order Started ===");
    console.log("Order ID:", orderId);
    console.log("Token:", token ? "Present" : "Missing");

    setIsViewLoading(true);
    try {
      console.log("Making API call to getOrderById...");
      const response = await adminApi.getOrderById(orderId);
      console.log("API Response:", response);

      const order = response.data?.order || response.data;
      console.log("Extracted order:", order);

      if (!order) {
        throw new Error("Order data not found in response");
      }

      console.log("Setting selected order...");
      setSelectedOrder(order);
      console.log("=== View Order Completed Successfully ===");
    } catch (error: any) {
      console.error("=== View Order Failed ===");
      console.error("Error object:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to load order details";

      console.error("Showing error toast:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrderIds.length === 0) {
      toast.error("Select at least one order");
      return;
    }

    try {
      await Promise.all(
        selectedOrderIds.map((orderId) =>
          adminApi.updateOrderStatus(orderId, { status: newStatus }),
        ),
      );
      toast.success(`Updated ${selectedOrderIds.length} order(s)`);
      setSelectedOrderIds([]);
      refetch();
    } catch {
      toast.error("Failed to update selected orders");
    }
  };

  const handleExportCsv = () => {
    exportOrdersToCsv(filteredOrders, "orders");
    toast.success("Orders exported to CSV");
  };

  const handleCreateShipment = async (orderId: string) => {
    if (!orderId) {
      console.error("Invalid order ID passed to handleCreateShipment");
      toast.error("Invalid order ID");
      return;
    }

    console.log("=== Create Shipment Started ===");
    console.log("Order ID:", orderId);
    console.log("Token:", token ? "Present" : "Missing");

    setUpdatingId(orderId);
    try {
      console.log("Making API call to createShipment...");
      const response = await adminApi.createShipment({ orderId });
      console.log("API Response:", response);

      const shipmentData = response.data?.data || response.data;
      console.log("Shipment data:", shipmentData);

      toast.success(
        `Shipment created! Tracking: ${shipmentData.trackingNumber}`,
        { duration: 5000 },
      );
      console.log("=== Create Shipment Completed Successfully ===");
      refetch();
    } catch (error: any) {
      console.error("=== Create Shipment Failed ===");
      console.error("Error object:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to create shipment";

      console.error("Showing error toast:", errorMessage);
      toast.error(errorMessage);
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

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={handleExportCsv}
          className="px-3 py-2 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 transition"
        >
          Export CSV
        </button>

        <PermissionGate
          allowedRoles={["ADMIN", "SUPER_ADMIN"]}
          fallback={
            <span className="text-xs text-gray-500">
              No permission for bulk updates
            </span>
          }
        >
          <span className="text-xs text-gray-600">
            {selectedOrderIds.length} selected
          </span>
          <select
            className="px-3 py-2 text-xs border border-gray-300 rounded"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                handleBulkStatusUpdate(event.target.value);
                event.target.value = "";
              }
            }}
          >
            <option value="">Bulk status update...</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </PermissionGate>
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
      ) : isMobile || isTablet ? (
        <OrderCardList
          orders={filteredOrders}
          onViewDetails={handleViewOrder}
          onStatusChange={handleStatusUpdate}
          onCreateShipment={handleCreateShipment}
          updatingId={updatingId}
          statusOptions={statusOptions}
          getStatusColor={getStatusColor}
        />
      ) : (
        <OrdersDataTable
          orders={filteredOrders}
          selectedOrderIds={selectedOrderIds}
          onToggleOrderSelection={toggleOrderSelection}
          onToggleSelectAll={toggleSelectAll}
          onStatusUpdate={handleStatusUpdate}
          onViewOrder={handleViewOrder}
          onCreateShipment={handleCreateShipment}
          updatingId={updatingId}
          statusOptions={statusOptions}
          getStatusColor={getStatusColor}
        />
      )}

      {isViewLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-700">Loading order details...</p>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">Order ID</p>
                  <p className="font-semibold text-gray-900">
                    {selectedOrder.id}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Order Number</p>
                  <p className="font-semibold text-gray-900">
                    {selectedOrder.orderNumber || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-semibold text-gray-900">
                    {selectedOrder.customerName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">
                    {selectedOrder.email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-semibold text-gray-900">
                    {selectedOrder.phone || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-semibold text-gray-900">
                    ₹{(selectedOrder.total || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 mb-1">Shipping Address</p>
                <div className="bg-gray-50 rounded-lg p-3 text-gray-800">
                  <p>
                    {selectedOrder.shippingAddress?.fullName ||
                      selectedOrder.customerName ||
                      "-"}
                  </p>
                  <p>
                    {selectedOrder.shippingAddress?.addressLine1 ||
                      selectedOrder.shippingAddress?.address ||
                      "-"}
                  </p>
                  {selectedOrder.shippingAddress?.addressLine2 && (
                    <p>{selectedOrder.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {selectedOrder.shippingAddress?.city || "-"},{" "}
                    {selectedOrder.shippingAddress?.state || "-"}{" "}
                    {selectedOrder.shippingAddress?.pincode || "-"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 mb-1">
                  Items (
                  {selectedOrder.itemsCount || selectedOrder.items?.length || 0}
                  )
                </p>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.productName || item.productId}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} • Weight: {item.weight}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ₹{Number(item.price || 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {(!selectedOrder.items ||
                    selectedOrder.items.length === 0) && (
                    <p className="text-gray-500">
                      No items found for this order.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
