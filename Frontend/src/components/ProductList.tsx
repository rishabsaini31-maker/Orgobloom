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
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-64 rounded-lg"></div>
            <div className="mt-4 space-y-2">
              <div className="bg-gray-200 h-4 rounded"></div>
              <div className="bg-gray-200 h-4 w-2/3 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">Failed to load products</div>
    );
  }

  const products = data?.data?.products || [];

  if (products.length === 0) {
    return (
      <div className="text-center text-gray-600">No products available</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product: any) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
