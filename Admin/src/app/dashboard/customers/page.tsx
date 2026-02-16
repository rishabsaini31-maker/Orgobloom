"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi, customersApi } from "@/lib/api";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export default function CustomersPage() {
  const [filter, setFilter] = useState<
    "all" | "active" | "blocked" | "problematic"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const { token } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: customersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["customers", token],
    queryFn: () => adminApi.getCustomers(),
    enabled: mounted && !!token,
    retry: 2,
    refetchOnMount: true,
  });

  // Handle different API response formats
  // API returns { data: [...], total: number }
  let customers: any[] = [];
  if (customersData) {
    const responseData = customersData.data || customersData;
    if (responseData.data && Array.isArray(responseData.data)) {
      customers = responseData.data;
    } else if (Array.isArray(responseData)) {
      customers = responseData;
    }
  }

  // Filter customers based on selected filter
  let filteredByStatus = customers;
  if (filter === "active") {
    filteredByStatus = customers.filter((c: any) => !c.isBlocked);
  } else if (filter === "blocked") {
    filteredByStatus = customers.filter((c: any) => c.isBlocked);
  } else if (filter === "problematic") {
    filteredByStatus = customers.filter(
      (c: any) => (c.issueLevel || "none") !== "none",
    );
  }

  const filteredCustomers = filteredByStatus.filter(
    (customer: any) =>
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.name &&
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.firstName &&
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.lastName &&
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleBlockCustomer = async (customerId: string) => {
    setBlockingId(customerId);
    try {
      await customersApi.blockCustomer(customerId, {
        reason: "Blocked by admin",
      });
      toast.success("Customer blocked successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to block customer");
    } finally {
      setBlockingId(null);
    }
  };

  const handleUnblockCustomer = async (customerId: string) => {
    setBlockingId(customerId);
    try {
      await customersApi.unblockCustomer(customerId);
      toast.success("Customer unblocked successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to unblock customer");
    } finally {
      setBlockingId(null);
    }
  };

  const blockedCount = Array.isArray(customers)
    ? customers.filter((c: any) => c.isBlocked).length
    : 0;
  const activeCount = Array.isArray(customers)
    ? customers.length - blockedCount
    : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Customer Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-gray-600 text-sm mb-2">Total Customers</h3>
          <p className="text-3xl font-bold text-primary-600">
            {customers.length}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-gray-600 text-sm mb-2">Active Customers</h3>
          <p className="text-3xl font-bold text-green-600">{activeCount}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-gray-600 text-sm mb-2">Blocked Customers</h3>
          <p className="text-3xl font-bold text-red-600">{blockedCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(["all", "active", "blocked", "problematic"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setFilter(tab);
              setSearchTerm("");
            }}
            className={`px-4 py-2 font-medium text-sm transition border-b-2 ${
              filter === tab
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "all"
              ? "All Customers"
              : tab === "active"
                ? "Active"
                : tab === "blocked"
                  ? "Blocked"
                  : "Problematic"}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by email, name, or customer info..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
      </div>

      {/* Customers Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium mb-2">
            Error loading customers
          </p>
          <p className="text-red-600 text-sm mb-4">
            {error instanceof Error
              ? error.message
              : "Failed to fetch customer data"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
          >
            Retry
          </button>
        </div>
      ) : !Array.isArray(customers) || customers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {!Array.isArray(customers)
              ? "No data available"
              : "No customers found"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer: any) => (
                <tr
                  key={customer.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {customer.name ||
                      `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                      "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {customer.phone || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="font-medium">
                      {customer.totalOrders || 0}
                    </span>
                    {customer.unPickedOrders > 0 && (
                      <span className="ml-2 text-xs text-orange-600">
                        ({customer.unPickedOrders} unpicked)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold">
                          {Math.round((customer.riskScore || 0) / 20)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {customer.fraudStatus || "SAFE"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        customer.isBlocked
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {customer.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                        onClick={() => {
                          // In a real app, this would navigate to customer detail page
                          toast.success(`View details for ${customer.email}`);
                        }}
                      >
                        View
                      </button>
                      {customer.isBlocked ? (
                        <button
                          disabled={blockingId === customer.id}
                          className="px-3 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 transition disabled:opacity-50"
                          onClick={() => handleUnblockCustomer(customer.id)}
                        >
                          {blockingId === customer.id ? "..." : "Unblock"}
                        </button>
                      ) : (
                        <button
                          disabled={blockingId === customer.id}
                          className="px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition disabled:opacity-50"
                          onClick={() => handleBlockCustomer(customer.id)}
                        >
                          {blockingId === customer.id ? "..." : "Block"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
