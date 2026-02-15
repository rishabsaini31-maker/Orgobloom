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
    queryFn: async () => {
      try {
        if (!adminApi.getInventory) {
          throw new Error("Inventory API not configured");
        }
        const result = await adminApi.getInventory();
        return result;
      } catch (err) {
        console.error("Inventory API Error:", err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache is kept for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
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

  // Use mock data if API is not configured
  if (!inventory || inventory.length === 0) {
    inventory = [
      {
        id: "1",
        name: "Organic Tomatoes",
        sku: "ORG-TOM-001",
        stock: 150,
        price: 45,
        category: "Vegetables",
      },
      {
        id: "2",
        name: "Fresh Spinach",
        sku: "ORG-SPIN-001",
        stock: 8,
        price: 30,
        category: "Vegetables",
      },
      {
        id: "3",
        name: "Organic Apples",
        sku: "ORG-APP-001",
        stock: 200,
        price: 80,
        category: "Fruits",
      },
      {
        id: "4",
        name: "Green Bell Pepper",
        sku: "ORG-PEP-001",
        stock: 0,
        price: 50,
        category: "Vegetables",
      },
      {
        id: "5",
        name: "Organic Milk",
        sku: "ORG-MIL-001",
        stock: 5,
        price: 60,
        category: "Dairy",
      },
      {
        id: "6",
        name: "Free Range Eggs",
        sku: "ORG-EGG-001",
        stock: 120,
        price: 120,
        category: "Dairy",
      },
    ];
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

  if (isError && !inventory.length) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Inventory Management</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-800 font-semibold mb-2">
            ℹ️ Showing Sample Data
          </p>
          <p className="text-blue-600 text-sm mb-4">
            The backend API is not yet configured. Displaying sample inventory
            to show you how the page will look. Real data will appear once the
            backend is configured.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Connect to Backend
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Inventory Management</h1>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {!isLoading && (
        <>
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
          {!Array.isArray(inventory) || inventory.length === 0 ? (
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
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Total Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.slice(0, 50).map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.name}
                      </td>
                      <td className="px-4 py-3">
                        {item.stock === 0 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            Out
                          </span>
                        ) : item.stock <= 10 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                            Low ({item.stock})
                          </span>
                        ) : (
                          <span className="text-sm text-gray-700">
                            {item.stock}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        ₹{item.price?.toFixed(2) || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        ₹{(item.stock * (item.price || 0)).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={updateQuantity[item.id] || ""}
                            onChange={(e) =>
                              setUpdateQuantity({
                                ...updateQuantity,
                                [item.id]: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                            placeholder="Qty"
                          />
                          <button
                            onClick={() =>
                              handleUpdateStock(
                                item.id,
                                updateQuantity[item.id] || 0,
                              )
                            }
                            disabled={updating === item.id}
                            className="px-3 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700 transition disabled:opacity-50"
                          >
                            {updating === item.id ? "Updating..." : "Update"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
