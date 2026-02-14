"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";

export default function DashboardPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: adminApi.getAnalytics,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const stats = analytics?.data || {};

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <h3 className="text-gray-600 text-sm mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-primary-600">
            {stats.totalOrders || 0}
          </p>
        </div>

        <div className="stat-card">
          <h3 className="text-gray-600 text-sm mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            ₹{(stats.totalRevenue || 0).toLocaleString()}
          </p>
        </div>

        <div className="stat-card">
          <h3 className="text-gray-600 text-sm mb-2">Pending Orders</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {stats.ordersByStatus?.PENDING || 0}
          </p>
        </div>

        <div className="stat-card">
          <h3 className="text-gray-600 text-sm mb-2">Completed Orders</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats.ordersByStatus?.DELIVERED || 0}
          </p>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Orders by Status</h2>
        <div className="space-y-3">
          {Object.entries(stats.ordersByStatus || {}).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <span className="text-gray-700">{status}</span>
              <span className="font-semibold">{count as number}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
