"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import { useState, useRef, useMemo, useEffect } from "react";

interface ProductCardProps {
  product: any;
  priority?: boolean;
}

export default function ProductCard({
  product,
  priority = false,
}: ProductCardProps) {
  const { addItem } = useCartStore();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const primaryImageSrc = useMemo(() => {
    const imageArray = Array.isArray(product.images)
      ? product.images.filter(
          (url: unknown) => typeof url === "string" && url.trim().length > 0,
        )
      : [];

    if (imageArray.length > 0) return imageArray[0] as string;
    if (
      typeof product.imageUrl === "string" &&
      product.imageUrl.trim().length > 0
    )
      return product.imageUrl;
    return "";
  }, [product.images, product.imageUrl]);

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [primaryImageSrc]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAddingToCart(true);

    // Add item to cart
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      weight: product.weight,
      quantity: 1,
      imageUrl: product.imageUrl,
    });

    // Show success toast with animation
    toast.success("Added to cart!", {
      icon: "🛒",
      style: {
        background: "#059669",
        color: "#fff",
        fontWeight: "bold",
      },
    });

    // Reset animation state
    setTimeout(() => setIsAddingToCart(false), 600);
  };

  const rating = product.rating || 4.5;
  const reviewCount = product.reviewCount || 0;

  return (
    <Link href={`/products/${product.slug}`}>
      <div
        ref={cardRef}
        className={`group relative bg-white rounded-3xl overflow-hidden h-full flex flex-col cursor-pointer transition-all duration-500 ${
          isAddingToCart
            ? "ring-4 ring-green-400 ring-opacity-50 scale-[1.02]"
            : ""
        } ${
          isHovered
            ? "shadow-2xl shadow-primary-500/20 scale-[1.02]"
            : "shadow-lg shadow-gray-200/50"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Premium Border Gradient */}
        <div
          className={`absolute inset-0 rounded-3xl transition-opacity duration-500 ${isHovered ? "opacity-100" : "opacity-0"}`}
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-400 via-emerald-400 to-green-400 opacity-20"></div>
        </div>

        {/* Image Section with Premium Styling */}
        <div className="relative h-64 sm:h-72 md:h-80 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden flex items-center justify-center">
          {/* Decorative Corner Elements */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-primary-100 to-transparent opacity-50"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-emerald-100 to-transparent opacity-50"></div>

          {/* Blurred Background */}
          {primaryImageSrc && !imageFailed ? (
            <>
              <Image
                src={primaryImageSrc}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover blur-xl scale-110 opacity-30"
                aria-hidden="true"
                loading={priority ? "eager" : "lazy"}
                priority={priority}
                quality={50}
                onError={() => setImageFailed(true)}
              />
              <Image
                src={primaryImageSrc}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`object-contain group-hover:scale-110 transition-transform duration-700 ease-out relative z-10 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageFailed(true);
                  setImageLoaded(false);
                }}
                loading={priority ? "eager" : "lazy"}
                priority={priority}
                quality={75}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300">
              <svg
                className="w-20 h-20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Loading Skeleton */}
          {!imageLoaded && !imageFailed && primaryImageSrc && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Stock Badge */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
              <span className="bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg">
                Out of Stock
              </span>
            </div>
          )}

          {/* Premium Organic Badge */}
          <div className="absolute top-4 left-4 z-20">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 blur-md opacity-50 rounded-full"></div>
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                ORGANIC
              </div>
            </div>
          </div>

          {/* Discount Badge */}
          {product.discount && (
            <div className="absolute top-4 right-4 z-20">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-md opacity-50 rounded-full"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  -{product.discount}%
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions - Show on Hover */}
          <div
            className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-500 ease-out ${
              isHovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <div className="bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 pt-12">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-white text-gray-900 hover:bg-primary-600 hover:text-white disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold py-3.5 rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 transition-all duration-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>

        {/* Content Section with Premium Styling */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col bg-white relative">
          {/* Decorative Top Line */}
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

          {/* Category Badge */}
          {product.category && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                {product.category === "cow" ? "🐄" : "🐔"}
                <span className="uppercase">{product.category} Manure</span>
              </span>
            </div>
          )}

          {/* Product Name */}
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors duration-300 mb-3">
            {product.name}
          </h3>

          {/* Rating with Enhanced Design */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400" : "text-gray-200"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-500 font-medium">
              {rating} ({reviewCount} reviews)
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1 leading-relaxed">
            {product.description}
          </p>

          {/* Price Section with Premium Design */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-emerald-600 bg-clip-text text-transparent">
                    ₹{product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹{product.originalPrice}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{product.weight}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-full">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                  Free Delivery
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Accent Line */}
        <div
          className={`h-1 bg-gradient-to-r from-primary-500 via-emerald-500 to-green-500 transition-transform duration-500 origin-left ${isHovered ? "scale-x-100" : "scale-x-0"}`}
        ></div>
      </div>
    </Link>
  );
}
