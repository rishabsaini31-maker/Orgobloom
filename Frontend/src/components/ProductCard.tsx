import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import { useState } from "react";

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      weight: product.weight,
      quantity: 1,
      imageUrl: product.imageUrl,
    });
    toast.success("Added to cart!");
  };

  const rating = product.rating || 4.5;
  const reviewCount = product.reviewCount || 0;

  return (
    <Link href={`/products/${product.slug}`}>
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col group cursor-pointer hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section */}
        <div className="relative h-56 sm:h-64 md:h-72 lg:h-80 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex items-center justify-center">
          {/* Blurred Background */}
          {product.images && product.images.length > 0 ? (
            <>
              <Image
                src={product.images[0]}
                alt=""
                fill
                className="object-cover blur-xl scale-110 opacity-40"
                aria-hidden="true"
              />
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className={`object-contain group-hover:scale-110 transition-transform duration-500 relative z-10 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : product.imageUrl ? (
            <>
              <Image
                src={product.imageUrl}
                alt=""
                fill
                className="object-cover blur-xl scale-110 opacity-40"
                aria-hidden="true"
              />
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className={`object-contain group-hover:scale-110 transition-transform duration-500 relative z-10 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Loading Skeleton */}
          {!imageLoaded && (product.images?.length > 0 || product.imageUrl) && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Stock Badge */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                Out of Stock
              </span>
            </div>
          )}

          {/* Discount Badge */}
          {product.discount && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold z-20 shadow-lg">
              -{product.discount}%
            </div>
          )}

          {/* Organic Badge */}
          <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold z-20 shadow-lg flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            ORGANIC
          </div>

          {/* Quick Actions - Show on Hover */}
          <div className={`absolute bottom-3 left-3 right-3 z-20 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          {/* Product Name */}
          <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors mb-2">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
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
            <span className="text-sm text-gray-500">({reviewCount} reviews)</span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
            {product.description}
          </p>

          {/* Price Details */}
          <div className="flex items-end justify-between pt-3 border-t border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary-600">
                  ₹{product.price}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{product.weight}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                Free Delivery
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
