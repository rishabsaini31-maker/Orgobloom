"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { BarChart, LineChart, PieChart } from "@/components/Charts";
import { useState } from "react";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["advanced-analytics", timeRange],
    queryFn: () => adminApi.getAdvancedAnalytics(timeRange),
  });

  const analytics = analyticsData?.data || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === range
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {range === "7d"
                ? "Last 7 Days"
                : range === "30d"
                  ? "Last 30 Days"
                  : "Last 90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-blue-600">
            ₹{(analytics.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.revenueGrowth || 0}% increase
          </p>
        </div>

        <div className="stat-card border-l-4 border-green-500">
          <h3 className="text-gray-600 text-sm mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-green-600">
            {analytics.totalOrders || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Avg: ₹
            {(
              (analytics.totalRevenue || 0) / (analytics.totalOrders || 1)
            ).toFixed(2)}
          </p>
        </div>

        <div className="stat-card border-l-4 border-yellow-500">
          <h3 className="text-gray-600 text-sm mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {(analytics.conversionRate || 0).toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Visitors: {analytics.totalVisitors || 0}
          </p>
        </div>

        <div className="stat-card border-l-4 border-purple-500">
          <h3 className="text-gray-600 text-sm mb-2">Avg Order Value</h3>
          <p className="text-3xl font-bold text-purple-600">
            ₹{(analytics.avgOrderValue || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Total Customers: {analytics.totalCustomers || 0}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Revenue Trend</h2>
          <LineChart
            data={{
              labels: analytics.chartData?.revenueTrend?.labels || [],
              datasets: [
                {
                  label: "Revenue",
                  data: analytics.chartData?.revenueTrend?.data || [],
                  borderColor: "#3b82f6",
                  bgColor: "rgba(59, 130, 246, 0.1)",
                  tension: 0.4,
                },
              ],
            }}
          />
        </div>

        {/* Order Status Distribution */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Order Status</h2>
          <PieChart
            data={{
              labels: analytics.chartData?.orderStatus?.labels || [],
              datasets: [
                {
                  data: analytics.chartData?.orderStatus?.data || [],
                  backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
                },
              ],
            }}
          />
        </div>

        {/* Sales by Category */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Sales by Category</h2>
          <BarChart
            data={{
              labels: analytics.chartData?.categorySales?.labels || [],
              datasets: [
                {
                  label: "Sales",
                  data: analytics.chartData?.categorySales?.data || [],
                  backgroundColor: "#3b82f6",
                },
              ],
            }}
          />
        </div>

        {/* Top Products */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Top 5 Products</h2>
          <div className="space-y-3">
            {(analytics.topProducts || []).map((product: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between pb-3 border-b last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-600 w-6">
                    #{idx + 1}
                  </span>
                  <span className="text-sm text-gray-700">{product.name}</span>
                </div>
                <span className="font-semibold text-primary-600">
                  ₹{product.revenue?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Customer Insights</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Repeat Customers:</span>{" "}
              {analytics.repeatCustomers || 0}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">New Customers:</span>{" "}
              {analytics.newCustomers || 0}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Retention Rate:</span>{" "}
              {(analytics.retentionRate || 0).toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold mb-4">Payment Methods</h3>
          <div className="space-y-2">
            {(analytics.paymentMethods || []).map(
              (method: any, idx: number) => (
                <p key={idx} className="text-sm text-gray-700">
                  <span className="font-semibold">{method.name}:</span>{" "}
                  {method.count}
                </p>
              ),
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Avg Order Count/Customer:</span>{" "}
              {(analytics.avgOrdersPerCustomer || 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Peak Hours:</span>{" "}
              {analytics.peakHours || "N/A"}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Cart Abandonment:</span>{" "}
              {(analytics.cartAbandonment || 0).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
