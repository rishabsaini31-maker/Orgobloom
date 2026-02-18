"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { token } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: analyticsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analytics", token],
    queryFn: adminApi.getAnalytics,
    enabled: mounted && !!token,
    retry: 2,
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache is kept for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Refetch on mount
  });

  // Parse analytics data with multiple format support
  let stats: any = {};
  if (analyticsData) {
    // API returns { data: { totalOrders, totalRevenue, ordersByStatus } }
    stats = analyticsData.data || analyticsData || {};
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <div className="h-10 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            >
              <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse mb-3"></div>
              <div className="h-8 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            >
              <div className="h-6 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse mb-6"></div>
              <div className="h-64 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Loading indicator text */}
        <div className="fixed bottom-8 right-8 flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
          <span className="text-sm text-gray-600">Loading dashboard...</span>
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
