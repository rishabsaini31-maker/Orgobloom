"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export default function PaymentsPage() {
  const [filter, setFilter] = useState<
    "all" | "completed" | "pending" | "failed"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { token } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: paymentsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["payments", filter, token],
    queryFn: () => adminApi.getPayments(filter),
    enabled: mounted && !!token,
    refetchOnMount: "stale",
  });

  // Handle different API response formats
  // API returns { data: [...] }
  let payments: any[] = [];
  if (paymentsData) {
    if (paymentsData.data && Array.isArray(paymentsData.data)) {
      payments = paymentsData.data;
    } else if (Array.isArray(paymentsData)) {
      payments = paymentsData;
    }
  }

  const filteredPayments = Array.isArray(payments)
    ? payments.filter(
        (payment: any) =>
          payment.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const handleRetryPayment = async (paymentId: string) => {
    try {
      await adminApi.retryPayment(paymentId);
      toast.success("Payment retry initiated");
      refetch();
    } catch (error) {
      toast.error("Failed to retry payment");
    }
  };

  if (isError) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Payment Management</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">
            ❌ Error Loading Payments
          </p>
          <p className="text-red-600 text-sm mb-4">
            {error instanceof Error
              ? error.message
              : "Failed to load payment data"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Payment Management</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <h3 className="text-gray-600 text-sm mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold">{payments.length}</p>
        </div>

        <div className="stat-card">
          <h3 className="text-gray-600 text-sm mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-600">
            {payments.filter((p: any) => p.status === "completed").length}
          </p>
        </div>

        <div className="stat-card">
          <h3 className="text-gray-600 text-sm mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {payments.filter((p: any) => p.status === "pending").length}
          </p>
        </div>

        <div className="stat-card">
          <h3 className="text-gray-600 text-sm mb-2">Failed</h3>
          <p className="text-3xl font-bold text-red-600">
            {payments.filter((p: any) => p.status === "failed").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            {(["all", "completed", "pending", "failed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                  filter === f
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search by Order ID or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredPayments.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPayments.map((payment: any) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {payment.orderId}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">
                        {payment.customerName}
                      </p>
                      <p className="text-xs text-gray-500">{payment.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                    ₹{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {payment.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {payment.status.charAt(0).toUpperCase() +
                        payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      {payment.status === "failed" && (
                        <button
                          onClick={() => handleRetryPayment(payment.id)}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Retry
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-gray-800 font-medium">
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No payments found</p>
          </div>
        )}
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Payment Methods</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Razorpay:</span>{" "}
              {payments.filter((p: any) => p.method === "Razorpay").length}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Credit Card:</span>{" "}
              {payments.filter((p: any) => p.method === "Credit Card").length}
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold mb-4">Success Rate</h3>
          <p className="text-3xl font-bold text-green-600">
            {(
              (payments.filter((p: any) => p.status === "completed").length /
                payments.length) *
                100 || 0
            ).toFixed(1)}
            %
          </p>
          <p className="text-xs text-gray-500 mt-2">
            from {payments.length} transactions
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold mb-4">Total Revenue</h3>
          <p className="text-3xl font-bold text-blue-600">
            ₹
            {payments
              .filter((p: any) => p.status === "completed")
              .reduce((sum: number, p: any) => sum + p.amount, 0)
              .toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">from completed payments</p>
        </div>
      </div>
    </div>
  );
}
