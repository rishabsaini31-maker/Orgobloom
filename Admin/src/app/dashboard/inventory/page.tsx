"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStock, setFilterStock] = useState<"all" | "low" | "out">("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateQuantity, setUpdateQuantity] = useState<{
    [key: string]: number;
  }>({});

  const {
    data: inventoryData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => adminApi.getInventory?.() || Promise.resolve([]),
  });

  // Handle different API response formats
  let inventory: any[] = [];
  if (inventoryData) {
    if (Array.isArray(inventoryData)) {
      inventory = inventoryData;
    } else if (Array.isArray(inventoryData.data)) {
      inventory = inventoryData.data;
    } else if (inventoryData.data && typeof inventoryData.data === "object") {
      inventory = Object.values(inventoryData.data);
    }
  }

  let filteredInventory = Array.isArray(inventory) ? inventory : [];

  if (filterStock === "low") {
    filteredInventory = filteredInventory.filter(
      (item: any) => item.stock <= 10 && item.stock > 0,
    );
  } else if (filterStock === "out") {
    filteredInventory = filteredInventory.filter(
      (item: any) => item.stock === 0,
    );
  }

  filteredInventory = filteredInventory.filter(
    (item: any) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleUpdateStock = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) {
      toast.error("Quantity cannot be negative");
      return;
    }
    setUpdating(productId);
    try {
      await adminApi.updateInventory?.(productId, { stock: newQuantity });
      toast.success("Stock updated successfully");
      setUpdateQuantity({ ...updateQuantity, [productId]: 0 });
      refetch();
    } catch (error) {
      toast.error("Failed to update stock");
    } finally {
      setUpdating(null);
    }
  };

  const stats = {
    lowStock: inventory.filter(
      (item: any) => item.stock <= 10 && item.stock > 0,
    ).length,
    outOfStock: inventory.filter((item: any) => item.stock === 0).length,
    totalValue: inventory.reduce(
      (sum: number, item: any) => sum + item.stock * (item.price || 0),
      0,
    ),
    avgStock: Math.round(
      inventory.reduce((sum: number, item: any) => sum + item.stock, 0) /
        Math.max(inventory.length, 1),
    ),
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Inventory Management</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Low Stock Items", count: stats.lowStock, icon: "⚠️" },
          { label: "Out of Stock", count: stats.outOfStock, icon: "❌" },
          {
            label: "Total Inventory Value",
            count: `₹${(stats.totalValue / 100000).toFixed(1)}L`,
            icon: "💰",
          },
          { label: "Avg Stock Level", count: stats.avgStock, icon: "📊" },
        ].map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-gray-600 text-xs mb-1">{stat.label}</h3>
                <p className="text-lg md:text-2xl font-bold text-primary-600">
                  {stat.count}
                </p>
              </div>
              <span className="text-xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(["all", "low", "out"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStock(tab)}
            className={`px-3 py-2 font-medium text-xs transition border-b-2 ${
              filterStock === tab
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "all"
              ? "All Items"
              : tab === "low"
                ? "Low Stock"
                : "Out of Stock"}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-700 font-medium mb-2">
            Inventory API not yet configured
          </p>
          <p className="text-blue-600 text-sm mb-4">
            This page will display inventory data once the backend API is
            integrated
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Retry
          </button>
        </div>
      ) : !Array.isArray(inventory) || inventory.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {!Array.isArray(inventory)
              ? "No data available"
              : "No inventory items found"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Product Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Current Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Inventory Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Update Stock
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.slice(0, 50).map((item: any) => {
                const inventoryValue = item.stock * (item.price || 0);
                const stockStatus =
                  item.stock === 0
                    ? "Out"
                    : item.stock <= 10
                      ? "Low"
                      : "Normal";
                const statusColor = {
                  Out: "bg-red-100 text-red-700",
                  Low: "bg-orange-100 text-orange-700",
                  Normal: "bg-green-100 text-green-700",
                }[stockStatus];

                return (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900">
                      ₹{(item.price || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-primary-600">
                      {item.stock}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900">
                      ₹{inventoryValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
                      >
                        {stockStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Qty"
                          value={updateQuantity[item.id] || ""}
                          onChange={(e) =>
                            setUpdateQuantity({
                              ...updateQuantity,
                              [item.id]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-12 px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                        <button
                          onClick={() =>
                            handleUpdateStock(
                              item.id,
                              updateQuantity[item.id] || 0,
                            )
                          }
                          disabled={updating === item.id}
                          className="px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition disabled:opacity-50"
                        >
                          {updating === item.id ? "..." : "Set"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredInventory.length > 50 && (
            <div className="px-4 py-3 text-xs text-gray-600 bg-gray-50 border-t border-gray-200">
              Showing 50 of {filteredInventory.length} items
            </div>
          )}
        </div>
      )}
    </div>
  );
}
