"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCarousel from "@/components/ProductCarousel";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import { productsApi } from "@/lib/api";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addItem } = useCartStore();
  const [selectedWeight, setSelectedWeight] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const response = await productsApi.getBySlug(slug);
      return response.data;
    },
  });

  const product = data?.product;

  const handleAddToCart = () => {
    if (!selectedWeight) {
      toast.error("Please select a weight/quantity");
      return;
    }

    const weightNum = parseInt(selectedWeight);
    const price = product.price * weightNum;

    addItem({
      productId: product.id,
      name: product.name,
      price: price,
      weight: selectedWeight,
      quantity: 1,
      imageUrl: product.imageUrl,
    });

    toast.success(`Added ${selectedWeight}kg to cart!`);
    setSelectedWeight("");
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="aspect-square bg-gray-200 rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-12 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-white rounded-lg p-12 shadow">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Product Not Found
              </h1>
              <p className="text-gray-600 mb-8">
                Sorry, the product you're looking for doesn't exist or has been
                removed.
              </p>
              <Link
                href="/products"
                className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-700 transition"
              >
                Back to Products
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex gap-2 text-gray-600 mb-8 text-sm">
            <Link href="/" className="hover:text-primary-600 transition">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/products"
              className="hover:text-primary-600 transition"
            >
              Products
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>

          {/* Product Carousel */}
          <ProductCarousel
            product={product}
            selectedWeight={selectedWeight}
            onWeightChange={setSelectedWeight}
            onAddToCart={handleAddToCart}
          />

          {/* Related Information Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Storage & Care */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-primary-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">📦</span>
                Storage & Care
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold mt-1">•</span>
                  <span>Store in a cool, dry place away from moisture.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold mt-1">•</span>
                  <span>
                    Keep away from direct sunlight to preserve nutrient quality.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold mt-1">•</span>
                  <span>Seal the container properly after opening.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold mt-1">•</span>
                  <span>Best used within 6 months of purchase.</span>
                </li>
              </ul>
            </div>

            {/* Application Guide */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-green-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">🌱</span>
                Application Guide
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>
                    <strong>Soil Preparation:</strong> Mix thoroughly with
                    existing soil before planting.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>
                    <strong>Top Dressing:</strong> Apply around plants and water
                    well.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>
                    <strong>Container Gardens:</strong> Use as 30-40% of soil
                    mix.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>
                    <strong>Lawns:</strong> Spread evenly and rake into soil.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Why Choose Section */}
          <div className="mt-16 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-2xl p-12 shadow-2xl">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Why Choose Our Product?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl mb-4">🌿</div>
                <h3 className="text-xl font-bold mb-2">100% Organic</h3>
                <p className="text-white text-opacity-90">
                  No chemicals, pesticides, or artificial additives. Pure
                  natural fertilizer.
                </p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">🌍</div>
                <h3 className="text-xl font-bold mb-2">Eco-Friendly</h3>
                <p className="text-white text-opacity-90">
                  Sustainable farming practices that protect the environment.
                </p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-xl font-bold mb-2">Fast Results</h3>
                <p className="text-white text-opacity-90">
                  See visible growth and improvement in soil health within
                  weeks.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Boost Your Garden Today!
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied farmers and gardeners who trust
              Orgobloom for premium organic fertilizers.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/products"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold border-2 border-primary-600 hover:bg-primary-50 transition"
              >
                View More Products
              </Link>
              <Link
                href="/cart"
                className="bg-primary-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-700 transition"
              >
                Go to Cart
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
