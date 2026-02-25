"use client";

import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import ProductCard from "./ProductCard";

interface ProductListProps {
  featured?: boolean;
}

export default function ProductList({ featured }: ProductListProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["products", { featured }],
    queryFn: async () => {
      // Add timestamp to bypass cache and get fresh data
      const response = await productsApi.getAll({
        featured,
        limit: 6,
        _t: Date.now(),
      });
      return response.data;
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-72 md:h-80 rounded-3xl"></div>
            <div className="mt-5 space-y-3 px-1">
              <div className="flex gap-2">
                <div className="bg-gray-200 h-6 rounded-full w-20"></div>
                <div className="bg-gray-200 h-6 rounded-full w-16"></div>
              </div>
              <div className="bg-gray-200 h-6 rounded w-3/4"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              <div className="bg-gray-200 h-12 rounded-xl mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-600 px-8 py-6 rounded-2xl inline-block shadow-lg">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-lg font-semibold">Failed to load products</p>
          <p className="text-sm text-red-500 mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  const products = data?.products || [];

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 px-8 py-12 rounded-3xl max-w-md mx-auto border border-gray-200">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <p className="text-xl font-semibold text-gray-700">
            No products available
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Check back soon for new organic products!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Products Grid - Responsive 3 columns on large screens */}
      <div
        className={`grid gap-6 md:gap-8 max-w-7xl mx-auto ${
          products.length === 1
            ? "grid-cols-1 max-w-md"
            : products.length === 2
              ? "grid-cols-1 sm:grid-cols-2 max-w-3xl"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {products.map((product: any, index: number) => (
          <div
            key={product.id}
            style={{ animationDelay: `${index * 0.1}s` }}
            className="opacity-0 animate-fade-in-up"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
