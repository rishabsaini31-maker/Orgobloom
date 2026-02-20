"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { productsApi } from "@/lib/api";

export default function ProductsPage() {
  const { addItem } = useCartStore();
  const [selectedWeights, setSelectedWeights] = useState<{
    [key: string]: string;
  }>({});
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch products from API using the api helper
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await productsApi.getAll();
      return response.data;
    },
  });

  const products = productsData?.products || [];
  const weights = [1, 2, 5, 10, 15, 25];

  // Filter products
  const filteredProducts = products.filter((product: any) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "cow") return product.category === "cow";
    if (activeFilter === "chicken") return product.category === "chicken";
    return true;
  });

  const handleAddToCart = (product: any, weight: string) => {
    if (!weight) {
      toast.error("Please select a weight/quantity");
      return;
    }

    const weightNum = parseInt(weight);
    const price = product.price * weightNum;

    addItem({
      productId: product.id,
      name: product.name,
      price: price,
      weight: weight,
      quantity: 1,
      imageUrl: product.imageUrl,
    });

    toast.success(`Added ${weight}kg to cart!`);
    setSelectedWeights({ ...selectedWeights, [product.id]: "" });
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-600 to-green-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">Our Premium Products</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              100% Organic Fertilizers for Healthy & Sustainable Farming
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-20">
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-gray-200 h-96 rounded-lg"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-20">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8">
                  <p className="text-red-600 font-semibold">
                    Failed to load products. Please try again later.
                  </p>
                </div>
              </div>
            )}

            {/* Filter Buttons */}
            {!isLoading && products.length > 0 && (
              <>
                <div className="mb-12">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={() => setActiveFilter("all")}
                      className={`px-8 py-3 rounded-full font-semibold transition-all transform ${
                        activeFilter === "all"
                          ? "bg-primary-600 text-white shadow-lg scale-105"
                          : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-600"
                      }`}
                    >
                      📦 All Products ({products.length})
                    </button>
                    <button
                      onClick={() => setActiveFilter("cow")}
                      className={`px-8 py-3 rounded-full font-semibold transition-all transform ${
                        activeFilter === "cow"
                          ? "bg-primary-600 text-white shadow-lg scale-105"
                          : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-600"
                      }`}
                    >
                      🐄 Cow Manure (
                      {products.filter((p: any) => p.category === "cow").length}
                      )
                    </button>
                    <button
                      onClick={() => setActiveFilter("chicken")}
                      className={`px-8 py-3 rounded-full font-semibold transition-all transform ${
                        activeFilter === "chicken"
                          ? "bg-primary-600 text-white shadow-lg scale-105"
                          : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-600"
                      }`}
                    >
                      🐔 Chicken Manure (
                      {
                        products.filter((p: any) => p.category === "chicken")
                          .length
                      }
                      )
                    </button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 mb-14">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-4xl mb-3">🌱</div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        100% Organic
                      </h3>
                      <p className="text-sm text-gray-600">
                        No chemicals, no pesticides. Pure natural certified
                        organic.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl mb-3">🥕</div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Maximum Yields
                      </h3>
                      <p className="text-sm text-gray-600">
                        Rich nutrients ensure healthy growth and maximum crop
                        yields.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl mb-3">♻️</div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Eco-Friendly
                      </h3>
                      <p className="text-sm text-gray-600">
                        Sustainable farming practices that protect our
                        environment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {filteredProducts.map((product: any) => (
                      <Link key={product.id} href={`/products/${product.slug}`}>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer h-full flex flex-col">
                          {/* Product Image */}
                          <div className="relative h-64 bg-gray-200 overflow-hidden">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <span className="text-5xl">
                                  {product.category === "cow" ? "🐄" : "🐔"}
                                </span>
                              </div>
                            )}
                            {/* Stock Status */}
                            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                              In Stock
                            </div>
                            {/* Featured Badge */}
                            {product.isFeatured && (
                              <div className="absolute top-4 left-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-bold">
                                ⭐ Featured
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="p-6 flex-1 flex flex-col">
                            {/* Category */}
                            <div className="mb-2">
                              <span className="text-xs font-bold bg-primary-100 text-primary-700 px-3 py-1 rounded-full uppercase">
                                {product.category === "cow"
                                  ? "🐄 Cow Manure"
                                  : "🐔 Chicken Manure"}
                              </span>
                            </div>

                            {/* Name */}
                            <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition">
                              {product.name}
                            </h3>

                            {/* Description */}
                            <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-2">
                              {product.description}
                            </p>

                            {/* Benefits */}
                            <div className="mb-4 space-y-1">
                              {product.benefits
                                ?.slice(0, 2)
                                .map((benefit: string, idx: number) => (
                                  <p
                                    key={idx}
                                    className="text-sm text-green-700 font-semibold"
                                  >
                                    {benefit.replace(/✓\s*/, "")}
                                  </p>
                                ))}
                            </div>

                            {/* Composition */}
                            <p className="text-xs text-gray-500 mb-4 font-semibold">
                              {product.composition}
                            </p>

                            {/* Price & Action */}
                            <div className="border-t pt-4 space-y-3">
                              <div>
                                <p className="text-xs text-gray-600 mb-1">
                                  Price per KG
                                </p>
                                <p className="text-3xl font-bold text-green-600">
                                  ₹{product.price}
                                </p>
                              </div>

                              {/* Weight Selection */}
                              <div>
                                <label className="text-xs font-bold text-gray-700 mb-2 block">
                                  Select Quantity
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {weights.map((weight) => (
                                    <button
                                      key={weight}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedWeights({
                                          ...selectedWeights,
                                          [product.id]: String(weight),
                                        });
                                      }}
                                      className={`py-2 px-2 rounded-lg font-bold transition text-xs ${
                                        selectedWeights[product.id] ===
                                        String(weight)
                                          ? "bg-primary-600 text-white shadow-lg"
                                          : "bg-gray-100 text-gray-900 border border-gray-300 hover:border-primary-600 hover:bg-primary-50"
                                      }`}
                                    >
                                      {weight}kg
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Add to Cart Button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAddToCart(
                                    product,
                                    selectedWeights[product.id],
                                  );
                                }}
                                className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all transform hover:shadow-lg active:scale-95 text-sm"
                              >
                                🛒 Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-gray-600 text-lg">
                      No products found in this category
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Boost Your Harvest?
            </h2>
            <p className="text-lg opacity-90 mb-6">
              Order your premium organic manure today!
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
