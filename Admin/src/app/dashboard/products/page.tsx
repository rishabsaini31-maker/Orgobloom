"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";

const EmptyProductModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    sku: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminApi.createProduct({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      });
      toast.success("Product created successfully");
      onClose();
      setFormData({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "",
        sku: "",
      });
    } catch (error) {
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Price (₹)"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              required
            />
            <input
              type="number"
              placeholder="Stock Qty"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              required
            />
            <input
              type="text"
              placeholder="SKU"
              value={formData.sku}
              onChange={(e) =>
                setFormData({ ...formData, sku: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
            >
              {isSubmitting ? "Creating..." : "Create Product"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ProductsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products"],
    queryFn: () => adminApi.getProducts(),
  });

  // Handle different API response formats
  let products: any[] = [];
  if (productsData) {
    if (Array.isArray(productsData)) {
      products = productsData;
    } else if (Array.isArray(productsData.data)) {
      products = productsData.data;
    } else if (productsData.data && typeof productsData.data === "object") {
      products = Object.values(productsData.data);
    }
  }

  let filteredProducts = Array.isArray(products) ? products : [];

  if (filter !== "all") {
    filteredProducts = filteredProducts.filter((p: any) =>
      filter === "active" ? p.isActive !== false : p.isActive === false,
    );
  }

  filteredProducts = filteredProducts.filter(
    (p: any) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeletingId(productId);
    try {
      await adminApi.deleteProduct(productId);
      toast.success("Product deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const stats = {
    total: products.length,
    active: products.filter((p: any) => p.isActive !== false).length,
    lowStock: products.filter((p: any) => p.stock <= 10).length,
    outOfStock: products.filter((p: any) => p.stock === 0).length,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
        >
          + Add Product
        </button>
      </div>

      <EmptyProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Products", count: stats.total, icon: "📦" },
          { label: "Active", count: stats.active, icon: "✅" },
          { label: "Low Stock", count: stats.lowStock, icon: "⚠️" },
          { label: "Out of Stock", count: stats.outOfStock, icon: "❌" },
        ].map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-gray-600 text-xs mb-1">{stat.label}</h3>
                <p className="text-2xl font-bold text-primary-600">
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
        {(["all", "active", "inactive"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-2 font-medium text-xs transition border-b-2 ${
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
          placeholder="Search by name, SKU, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium mb-2">
            Error loading products
          </p>
          <p className="text-red-600 text-sm mb-4">
            {error instanceof Error
              ? error.message
              : "Failed to fetch product data"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
          >
            Retry
          </button>
        </div>
      ) : !Array.isArray(products) || products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {!Array.isArray(products)
              ? "No data available"
              : "No products found"}
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
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.slice(0, 50).map((product: any) => {
                const stockStatus =
                  product.stock === 0
                    ? "Out of Stock"
                    : product.stock <= 10
                      ? "Low Stock"
                      : "In Stock";
                const stockColor = {
                  "Out of Stock": "text-red-600",
                  "Low Stock": "text-orange-600",
                  "In Stock": "text-green-600",
                }[stockStatus];

                return (
                  <tr
                    key={product.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {product.category}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900">
                      ₹{(product.price || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${stockColor}`}>
                          {product.stock}
                        </span>
                        <span className="text-gray-500">units</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.isActive !== false
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs flex gap-2">
                      <button
                        onClick={() => toast.success(`Edit ${product.name}`)}
                        className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition disabled:opacity-50"
                      >
                        {deletingId === product.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length > 50 && (
            <div className="px-4 py-3 text-xs text-gray-600 bg-gray-50 border-t border-gray-200">
              Showing 50 of {filteredProducts.length} products
            </div>
          )}
        </div>
      )}
    </div>
  );
}
