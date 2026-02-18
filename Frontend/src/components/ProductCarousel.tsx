"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCarouselProps {
  product: any;
  onAddToCart: () => void;
  quantity?: number;
  onQuantityChange?: (qty: number) => void;
  selectedWeight?: string;
  onWeightChange?: (weight: string) => void;
}

export default function ProductCarousel({
  product,
  onAddToCart,
  quantity = 1,
  onQuantityChange,
  selectedWeight = "",
  onWeightChange,
}: ProductCarouselProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const weights = [1, 2, 5, 10, 15, 25];

  // Use images array from product, or fallback to single imageUrl
  const images =
    product.images && product.images.length > 0
      ? product.images.filter(Boolean)
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const rating = 4.8; // Default rating for manure products
  const ratingCount = 5;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left: Product Carousel */}
      <div className="sticky top-20">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Main Image */}
          <div className="relative w-full aspect-square bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center overflow-hidden group">
            {images[currentImageIndex] ? (
              <Image
                src={images[currentImageIndex]}
                alt={product.name}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="text-6xl">🐄</div>
            )}

            {/* Product Badge */}
            <div className="absolute top-4 right-4">
              <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                In Stock
              </span>
            </div>

            {/* Featured Badge */}
            {product.isFeatured && (
              <div className="absolute top-4 left-4">
                <span className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ Featured
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails Navigation */}
          <div className="bg-gradient-to-b from-gray-50 to-white px-6 py-4 border-t border-gray-200">
            <div className="flex justify-center gap-3 overflow-x-auto pb-2">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === idx
                      ? "border-primary-500 shadow-lg scale-105"
                      : "border-gray-300 hover:border-primary-300"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    className="object-contain"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-around bg-gradient-to-r from-primary-50 to-green-50 border-t border-gray-200 p-6">
            <button
              onClick={goToPrevious}
              className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary-400 text-primary-600 hover:bg-primary-50 transition-all transform hover:scale-110 active:scale-95"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="text-center">
              <span className="text-sm text-gray-600 font-semibold">
                {currentImageIndex + 1} / {images.length}
              </span>
            </div>

            <button
              onClick={goToNext}
              className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary-400 text-primary-600 hover:bg-primary-50 transition-all transform hover:scale-110 active:scale-95"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Right: Product Details */}
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
          <span className="text-primary-600">
            🌱 {product.category === "cow" ? "Cow Manure" : "Chicken Manure"}
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            {product.name}
          </h1>
          <p className="text-gray-600 leading-relaxed text-lg">
            {product.description}
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-xl ${
                  i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-sm text-gray-600 font-semibold">
            {rating} ({ratingCount}+ reviews)
          </span>
        </div>

        {/* Price */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
          <p className="text-sm text-gray-700 font-semibold mb-2">
            PRICE PER KILOGRAM
          </p>
          <p className="text-4xl font-bold text-green-600">
            ₹{product.price}
            <span className="text-xl text-gray-600">/kg</span>
          </p>
          {selectedWeight && (
            <p className="text-sm text-green-700 font-semibold mt-3">
              Total for {selectedWeight}kg:{" "}
              <span className="text-2xl text-green-600">
                ₹{(product.price * parseInt(selectedWeight)).toFixed(2)}
              </span>
            </p>
          )}
        </div>

        {/* Composition */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-xs font-bold text-gray-700 mb-2">COMPOSITION</p>
            <p className="text-sm font-bold text-gray-900">
              {product.composition}
            </p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
            <p className="text-xs font-bold text-gray-700 mb-2">USAGE</p>
            <p className="text-sm font-bold text-gray-900">{product.usage}</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
          <p className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
            Key Benefits:
          </p>
          <ul className="space-y-3">
            {product.benefits?.map((benefit: string, idx: number) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-sm text-gray-700"
              >
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>{benefit.replace(/✓\s*/g, "")}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weight Selection */}
        <div>
          <label className="text-sm font-bold text-gray-900 mb-3 block uppercase tracking-wide">
            Select Quantity (KG)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {weights.map((weight) => (
              <button
                key={weight}
                onClick={() => onWeightChange?.(String(weight))}
                className={`py-3 px-2 rounded-lg font-bold transition-all transform text-sm ${
                  selectedWeight === String(weight)
                    ? "bg-primary-600 text-white shadow-lg border-2 border-primary-700 scale-105"
                    : "bg-gray-100 text-gray-900 border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 active:scale-95"
                }`}
              >
                {weight}kg
                {weight === 25 && " ⭐"}
              </button>
            ))}
          </div>
        </div>

        {/* Add to Cart */}
        <button
          onClick={onAddToCart}
          disabled={!selectedWeight}
          className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold text-lg rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all transform hover:shadow-xl active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
        >
          🛒 Add to Cart {selectedWeight && `(${selectedWeight}kg)`}
        </button>

        {/* Trust Badges */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 text-center">
          <p className="text-sm font-bold text-gray-700 space-y-2">
            <div className="text-lg">✓ 100% Certified Organic</div>
            <div className="text-lg">✓ Fast Delivery Available</div>
            <div className="text-lg">✓ Quality Guaranteed</div>
          </p>
        </div>
      </div>
    </div>
  );
}
