"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";

export default function ProductsPage() {
  const { addItem } = useCartStore();
  const [selectedWeights, setSelectedWeights] = useState<{
    [key: string]: string;
  }>({});
  const [activeFilter, setActiveFilter] = useState("all");

  const products = [
    {
      id: "cow-manure-1",
      name: "Premium Cow Manure",
      type: "Cow Manure",
      category: "🐄 Cow Manure",
      basePrice: 250,
      rating: 4.8,
      reviews: 342,
      image: "🐄",
      description:
        "Rich in nutrients and microorganisms, our cow manure is sourced from certified organic farms. Perfect for vegetable gardens and flowering plants.",
      benefits: [
        "✓ Improves soil structure",
        "✓ Rich in nitrogen content",
        "✓ Enhances water retention",
        "✓ Promotes beneficial microbes",
      ],
      usage: "Mix 2-3 kg per sq.meter of garden soil or apply as top dressing",
      composition: "Nitrogen 2.5%, Phosphorus 1.2%, Potassium 1.8%",
    },
    {
      id: "chicken-manure-1",
      name: "Premium Chicken Manure",
      type: "Chicken Manure",
      category: "🐔  Chicken Manure",
      basePrice: 290,
      rating: 4.9,
      reviews: 287,
      image: "🐔",
      description:
        "High-nitrogen chicken manure boosts plant growth rapidly. Ideal for leafy greens, cereals, and heavy-feeding plants.",
      benefits: [
        "✓ High nitrogen content (3.2%)",
        "✓ Fast nutrient release",
        "✓ Enhances foliage growth",
        "✓ Kills weed seeds",
      ],
      usage: "Use 1-2 kg per sq.meter, mix well with soil before planting",
      composition: "Nitrogen 3.2%, Phosphorus 2.1%, Potassium 1.5%",
    },
  ];

  const weights = [1, 2, 5, 10, 15, 25];

  // Filter products based on active filter
  const filteredProducts = products.filter((product) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "cow") return product.type === "Cow Manure";
    if (activeFilter === "chicken") return product.type === "Chicken Manure";
    return true;
  });

  const handleAddToCart = (product: any, weight: string) => {
    if (!weight) {
      toast.error("Please select a weight/quantity");
      return;
    }

    const weightNum = parseInt(weight);
    const price = product.basePrice * weightNum;

    addItem({
      productId: product.id,
      name: product.name,
      price: price,
      weight: weight,
      quantity: 1,
      imageUrl: product.image,
    });

    toast.success(`Added ${weight}kg to cart!`);
    setSelectedWeights({ ...selectedWeights, [product.id]: "" });
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Our Premium Products</h1>
            <p className="text-lg opacity-90">
              100% Organic Fertilizers for Healthy & Sustainable Farming
            </p>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            {/* Filter Tabs */}
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
                  {products.filter((p) => p.type === "Cow Manure").length})
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
                  {products.filter((p) => p.type === "Chicken Manure").length})
                </button>
              </div>
            </div>

            {/* Category Info */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-8 mb-14">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose Our Organic Manure?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition">
                  <div className="text-4xl mb-3">🌱</div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                    100% Organic
                  </h3>
                  <p className="text-sm text-gray-600">
                    No chemicals, no pesticides. Pure natural manure certified
                    organic.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition">
                  <div className="text-4xl mb-3">🥕</div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                    Maximum Yields
                  </h3>
                  <p className="text-sm text-gray-600">
                    Rich nutrients ensure healthy growth and maximum crop
                    yields.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition">
                  <div className="text-4xl mb-3">♻️</div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                    Eco-Friendly
                  </h3>
                  <p className="text-sm text-gray-600">
                    Sustainable farming practices that protect our environment.
                  </p>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all transform hover:scale-105 duration-300 border border-gray-100"
                  >
                    {/* Product Image Section */}
                    <div className="bg-gradient-to-br from-primary-100 via-primary-50 to-blue-50 p-8 flex flex-col items-center justify-center h-48 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary-200 to-transparent"></div>
                      <div className="text-7xl z-10">{product.image}</div>
                      <div className="absolute top-3 right-3 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                        ⭐ {product.rating}
                      </div>
                    </div>

                    {/* Product Content */}
                    <div className="p-6 space-y-4">
                      {/* Category Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full uppercase tracking-wide">
                          {product.category}
                        </span>
                        <span className="text-xs text-gray-600">
                          ({product.reviews} reviews)
                        </span>
                      </div>

                      {/* Product Name */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      {/* Price Box - Prominent */}
                      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-600 font-semibold mb-1">
                          PRICE PER KG
                        </p>
                        <p className="text-3xl font-bold text-primary-600">
                          ₹{product.basePrice}
                        </p>
                        <p className="text-xs text-gray-600 font-semibold">
                          per 1kg
                        </p>
                      </div>

                      {/* Benefits */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                          Key Benefits:
                        </p>
                        <div className="space-y-1.5">
                          {product.benefits.map((benefit, idx) => (
                            <p
                              key={idx}
                              className="text-xs text-gray-700 font-medium"
                            >
                              {benefit}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Composition & Usage */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                          <p className="text-xs font-bold text-gray-900 mb-1">
                            Composition
                          </p>
                          <p className="text-xs font-semibold text-gray-800">
                            N: 2.5% | P: 1.2% | K: 1.8%
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                          <p className="text-xs font-bold text-gray-900 mb-1">
                            Usage
                          </p>
                          <p className="text-xs text-gray-700">
                            2-3 kg/sq.meter
                          </p>
                        </div>
                      </div>

                      {/* Weight Selection */}
                      <div>
                        <label className="text-xs font-bold text-gray-900 mb-3 block uppercase tracking-wide">
                          Select Quantity (kg):
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {weights.map((weight) => (
                            <button
                              key={weight}
                              onClick={() =>
                                setSelectedWeights({
                                  ...selectedWeights,
                                  [product.id]: String(weight),
                                })
                              }
                              className={`py-2 px-2 rounded-lg font-bold transition text-xs ${
                                selectedWeights[product.id] === String(weight)
                                  ? "bg-primary-600 text-white shadow-lg border-2 border-primary-700"
                                  : "bg-gray-100 text-gray-900 border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50"
                              }`}
                            >
                              {weight}
                              {weight === 25 ? "★" : ""}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Price Display for Selected Weight */}
                      {selectedWeights[product.id] && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-3 text-center shadow-sm">
                          <p className="text-xs text-gray-700 font-semibold mb-1">
                            Total Price for {selectedWeights[product.id]}kg:
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            ₹
                            {(
                              product.basePrice *
                              parseInt(selectedWeights[product.id])
                            ).toFixed(2)}
                          </p>
                        </div>
                      )}

                      {/* Add to Cart Button */}
                      <button
                        onClick={() =>
                          handleAddToCart(product, selectedWeights[product.id])
                        }
                        className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all transform hover:shadow-lg active:scale-95 text-sm uppercase tracking-wide"
                      >
                        🛒 Add to Cart
                      </button>

                      {/* Trust Badge */}
                      <div className="pt-3 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-600 font-semibold">
                          ✓ 100% Organic | ✓ Fast Delivery | ✓ Guaranteed
                          Quality
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  No products found in this category
                </p>
              </div>
            )}

            {/* Recommendation Section */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-10 shadow-xl">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Which Product Should You Choose?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur">
                  <h3 className="text-2xl font-bold mb-4 flex items-center">
                    🐄 Cow Manure
                  </h3>
                  <p className="mb-4 opacity-95">
                    Best for general gardening and long-term soil improvement
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Vegetable gardens</li>
                    <li>✓ Flower beds and ornamental plants</li>
                    <li>✓ General soil conditioning</li>
                    <li>✓ Ideal for beginners</li>
                    <li>✓ ₹250 per 1kg</li>
                  </ul>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur">
                  <h3 className="text-2xl font-bold mb-4 flex items-center">
                    🐔 Chicken Manure
                  </h3>
                  <p className="mb-4 opacity-95">
                    Best for heavy-feeding crops with rapid growth requirement
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Leafy greens and vegetables</li>
                    <li>✓ Cereals and commercial crops</li>
                    <li>✓ Quick nutrient boost</li>
                    <li>✓ Nutrient-depleted soils</li>
                    <li>✓ ₹290 per 1kg</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Ready to Boost Your Garden? 🌿
              </h3>
              <Link
                href="/cart"
                className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-4 rounded-lg font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all transform hover:shadow-xl active:scale-95"
              >
                View Cart & Checkout →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
