"use client";

import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import ProductCard from "./ProductCard";

interface ProductListProps {
  featured?: boolean;
}

export default function ProductList({ featured }: ProductListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["products", { featured }],
    queryFn: () => productsApi.getAll({ featured, limit: 6 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // Show previous data while fetching
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-64 md:h-80 rounded-2xl"></div>
            <div className="mt-4 space-y-3 px-2">
              <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              <div className="bg-gray-200 h-10 rounded mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl inline-block">
          Failed to load products. Please try again.
        </div>
      </div>
    );
  }

  const products = data?.data?.products || [];

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 text-gray-600 px-6 py-8 rounded-xl">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="text-lg font-medium">No products available</p>
          <p className="text-sm text-gray-500 mt-1">
            Check back soon for new products!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-6 md:gap-8 max-w-5xl mx-auto stagger-children ${
        products.length === 1
          ? "grid-cols-1 max-w-md"
          : "grid-cols-1 sm:grid-cols-2"
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
  );
}
