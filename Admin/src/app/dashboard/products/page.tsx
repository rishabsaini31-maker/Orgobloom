"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";

interface EmptyProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  isEdit?: boolean;
  onEditSuccess?: () => void;
}

const EmptyProductModal = ({
  isOpen,
  onClose,
  initialData,
  isEdit,
  onEditSuccess,
}: EmptyProductModalProps) => {
  const [formData, setFormData] = useState(() => {
    if (isEdit && initialData) {
      return {
        name: initialData.name || "",
        description: initialData.description || "",
        howToUse: initialData.howToUse || "",
        benefits: initialData.benefits || "",
        compositions: initialData.compositions || "",
        price: initialData.price?.toString() || "",
        comparePrice: initialData.comparePrice?.toString() || "",
        stock: initialData.stock?.toString() || "",
        category: initialData.category || "",
        sku: initialData.sku || "",
        imageAltText: initialData.imageAltText || "",
        metaTitle: initialData.metaTitle || "",
        metaDescription: initialData.metaDescription || "",
      };
    }
    return {
      name: "",
      description: "",
      howToUse: "",
      benefits: "",
      compositions: "",
      price: "",
      comparePrice: "",
      stock: "",
      category: "",
      sku: "",
      imageAltText: "",
      metaTitle: "",
      metaDescription: "",
    };
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 6) {
      toast.error("Maximum 6 images allowed");
      return;
    }
    const newFiles = files.slice(0, 6 - images.length);
    setImages([...images, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error("Please upload at least 1 image");
      return;
    }

    if (images.length > 6) {
      toast.error("Maximum 6 images allowed");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadData = new FormData();
      images.forEach((image) => uploadData.append("images", image));

      const uploadResponse = await adminApi.uploadProductImages(uploadData);
      const uploadedUrls = uploadResponse.data?.urls || [];

      if (!uploadedUrls.length) {
        throw new Error("Image upload failed");
      }

      await adminApi.createProduct({
        ...formData,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice
          ? parseFloat(formData.comparePrice)
          : null,
        stock: parseInt(formData.stock, 10),
        imageUrl: uploadedUrls[0],
        images: uploadedUrls,
        imageAltText: formData.imageAltText || formData.name,
        metaTitle: formData.metaTitle || formData.name,
        metaDescription:
          formData.metaDescription || formData.description?.substring(0, 160),
      });
      toast.success("Product created successfully");
      onClose();
      setFormData({
        name: "",
        description: "",
        howToUse: "",
        benefits: "",
        compositions: "",
        price: "",
        comparePrice: "",
        stock: "",
        category: "",
        sku: "",
        imageAltText: "",
        metaTitle: "",
        metaDescription: "",
      });
      setImages([]);
      setImagePreviews([]);
    } catch (error: any) {
      console.error("Create product error:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to create product",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl shadow-lg my-8">
        <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[80vh] overflow-y-auto"
        >
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              placeholder="Enter product name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              placeholder="Brief overview of the product"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              rows={2}
            />
          </div>

          {/* How to Use */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How to Use
            </label>
            <textarea
              placeholder="Usage instructions and guidelines"
              value={formData.howToUse}
              onChange={(e) =>
                setFormData({ ...formData, howToUse: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              rows={2}
            />
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Benefits
            </label>
            <textarea
              placeholder="Key benefits and health advantages"
              value={formData.benefits}
              onChange={(e) =>
                setFormData({ ...formData, benefits: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              rows={2}
            />
          </div>

          {/* Compositions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compositions
            </label>
            <textarea
              placeholder="Ingredients and components list"
              value={formData.compositions}
              onChange={(e) =>
                setFormData({ ...formData, compositions: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              rows={2}
            />
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                placeholder="Selling Price"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compare at Price (₹)
              </label>
              <input
                type="number"
                placeholder="Original/MRP Price"
                value={formData.comparePrice}
                onChange={(e) =>
                  setFormData({ ...formData, comparePrice: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Original price for showing discount
              </p>
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity *
            </label>
            <input
              type="number"
              placeholder="Stock"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              required
            />
          </div>

          {/* Category and SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                required
              >
                <option value="">Select category</option>
                <option value="cow">Cow Manure</option>
                <option value="chicken">Chicken Manure</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                placeholder="e.g., COW-001 or CHICKEN-002"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique product code, e.g. COW-001
              </p>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images (Min: 1, Max: 6) *
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              disabled={images.length >= 6}
              className="w-full text-sm text-gray-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-2">
              {images.length}/6 images selected
            </p>
          </div>

          {/* Image Alt Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image Alt Text
            </label>
            <input
              type="text"
              placeholder="Describe the image for accessibility"
              value={formData.imageAltText}
              onChange={(e) =>
                setFormData({ ...formData, imageAltText: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for SEO and screen readers
            </p>
          </div>

          {/* SEO Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              SEO Settings
            </h3>

            {/* Meta Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                placeholder="SEO title for search engines"
                value={formData.metaTitle}
                onChange={(e) =>
                  setFormData({ ...formData, metaTitle: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                maxLength={60}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.metaTitle.length}/60 characters (recommended: 50-60)
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                placeholder="Brief description for search engine results"
                value={formData.metaDescription}
                onChange={(e) =>
                  setFormData({ ...formData, metaDescription: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                rows={2}
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.metaDescription.length}/160 characters (recommended:
                150-160)
              </p>
            </div>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Previews
              </label>
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="submit"
              disabled={isSubmitting || images.length === 0}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Edit"
                  : "Create Product"}
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
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products"],
    queryFn: () => adminApi.getProducts(),
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache is kept for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  });

  // Handle different API response formats
  let products: any[] = [];
  if (productsData) {
    // Handle deeply nested data structure
    if (Array.isArray(productsData)) {
      products = productsData;
    } else if (Array.isArray(productsData.data)) {
      products = productsData.data;
    } else if (productsData.data && Array.isArray(productsData.data.data)) {
      products = productsData.data.data;
    } else if (productsData.data && typeof productsData.data === "object") {
      products = Object.values(productsData.data);
    }
  }

  // Map isActive to status for filtering and display
  const mappedProducts = products.map((p: any) => ({
    ...p,
    status: p.isActive ? "active" : "inactive",
  }));

  let filteredProducts = mappedProducts;
  if (filter === "active") {
    filteredProducts = mappedProducts.filter((p: any) => p.status === "active");
  } else if (filter === "inactive") {
    filteredProducts = mappedProducts.filter(
      (p: any) => p.status === "inactive",
    );
  }

  filteredProducts = filteredProducts.filter(
    (product: any) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeletingId(productId);
    try {
      await adminApi.deleteProduct?.(productId);
      toast.success("Product deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Products Management</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          + Add Product
        </button>
      </div>

      <EmptyProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      {editingProduct && (
        <EmptyProductModal
          isOpen={true}
          onClose={() => setEditingProduct(null)}
          initialData={editingProduct}
          isEdit={true}
          onEditSuccess={() => {
            setEditingProduct(null);
            refetch();
          }}
        />
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">
            Error loading products:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Search and Filter */}
          <div className="mb-6 space-y-4">
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
            <div className="flex gap-2 border-b border-gray-200">
              {(["all", "active", "inactive"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 font-medium text-xs transition border-b-2 ${
                    filter === f
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Products List */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {products.length === 0
                  ? "No products yet. Click 'Add Product' to get started."
                  : "No products match your search."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product: any) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">
                      {product.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        product.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.status || "active"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {product.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Price</p>
                      <p className="font-semibold">₹{product.price}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Stock</p>
                      <p
                        className={`font-semibold ${product.stock === 0 ? "text-red-600" : "text-gray-900"}`}
                      >
                        {product.stock}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="flex-1 px-3 py-1 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={deletingId === product.id}
                      className="flex-1 px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {deletingId === product.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
