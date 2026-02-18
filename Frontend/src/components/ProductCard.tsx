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
        className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 h-full flex flex-col group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section */}
        <div className="relative h-64 bg-gray-100 overflow-hidden flex items-center justify-center">
          {/* Blurred Background */}
          {product.images && product.images.length > 0 ? (
            <>
              <Image
                src={product.images[0]}
                alt=""
                fill
                className="object-cover blur-xl scale-110 opacity-50"
                aria-hidden="true"
              />
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-300 relative z-10"
              />
            </>
          ) : product.imageUrl ? (
            <>
              <Image
                src={product.imageUrl}
                alt=""
                fill
                className="object-cover blur-xl scale-110 opacity-50"
                aria-hidden="true"
              />
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-300 relative z-10"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Stock Badge */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <span className="bg-red-600 text-white px-4 py-2 rounded font-bold">
                Out of Stock
              </span>
            </div>
          )}

          {/* Discount Badge */}
          {product.discount && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded text-sm font-bold">
              -{product.discount}%
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Product Name */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-600">({reviewCount})</span>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
            {product.description}
          </p>

          {/* Price Details */}
          <div className="mt-auto pt-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary-600">
                ₹{product.price}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">{product.weight}</p>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full mt-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 rounded transition-colors text-sm"
          >
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>

          {/* Quick View */}
          <button className="w-full mt-2 border border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold py-2 rounded transition-colors text-sm">
            Quick View
          </button>
        </div>
      </div>
    </Link>
  );
}
