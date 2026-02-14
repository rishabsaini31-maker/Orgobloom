import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
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

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <Link href={`/products/${product.slug}`}>
        <div className="relative h-64 mb-4 bg-gray-100 rounded-lg overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Image
            </div>
          )}
        </div>
      </Link>

      <Link href={`/products/${product.slug}`}>
        <h3 className="text-xl font-bold mb-2 hover:text-primary-600">
          {product.name}
        </h3>
      </Link>

      <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold text-primary-600">
            ₹{product.price}
          </span>
          <span className="text-gray-500 ml-2">{product.weight}</span>
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={product.stock === 0}
        className="w-full mt-4 btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}
