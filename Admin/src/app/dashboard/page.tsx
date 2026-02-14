"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";

export default function DashboardPage() {
  const {
    data: analyticsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analytics"],
    queryFn: adminApi.getAnalytics,
    retry: 2,
  });

  // Parse analytics data with multiple format support
  let stats: any = {};
  if (analyticsData) {
    if (analyticsData.data) {
      stats = analyticsData.data;
    } else if (typeof analyticsData === "object") {
      stats = analyticsData;
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700 font-medium mb-2">
          Failed to load dashboard
        </p>
        <p className="text-red-600 text-sm mb-4">
          {error instanceof Error ? error.message : "Unknown error occurred"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-gray-600 text-sm mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-primary-600">
            {stats?.totalOrders || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-gray-600 text-sm mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            ₹{(stats?.totalRevenue || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-gray-600 text-sm mb-2">Pending Orders</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {stats?.ordersByStatus?.PENDING || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-gray-600 text-sm mb-2">Completed Orders</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats?.ordersByStatus?.DELIVERED || 0}
          </p>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Orders by Status</h2>
        {Object.keys(stats?.ordersByStatus || {}).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(stats?.ordersByStatus || {}).map(
              ([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-gray-700">{status}</span>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No order data available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
