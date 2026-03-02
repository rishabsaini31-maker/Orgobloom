"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import RazorpayCheckout from "@/components/RazorpayCheckout";

// Helper function to fix localhost URLs for production
const fixImageUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;

  // If it's already a valid external URL (not localhost), return as is
  if (!url.includes("localhost") && !url.includes("127.0.0.1")) return url;

  // Get the API URL from environment
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Extract the path after localhost:port or /uploads/
  let imagePath = "";

  // Try to extract path after /uploads/
  const uploadsMatch = url.match(/\/uploads\/(.+)$/);
  if (uploadsMatch) {
    imagePath = `uploads/${uploadsMatch[1]}`;
  } else {
    // Try to extract path after the port number
    const pathMatch = url.match(/localhost:\d+\/(.+)$/);
    if (pathMatch) {
      imagePath = pathMatch[1];
    }
  }

  if (!imagePath) return url;

  // Construct the production URL
  if (apiUrl) {
    const baseUrl = apiUrl.replace("/api", "");
    return `${baseUrl}/${imagePath}`;
  }

  // Fallback: try to use window location to determine production backend
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // If we're on Vercel, construct the backend URL
    if (hostname.includes("vercel.app") || hostname !== "localhost") {
      // Common Render backend URL pattern
      return `https://orgobloom-backend.onrender.com/${imagePath}`;
    }
  }

  return url;
};

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } =
    useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [selectedAddress, setSelectedAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const TAX_RATE = 0.05; // 5% tax
  const DELIVERY_CHARGE = items.length > 0 ? 50 : 0; // ₹50 delivery charge

  const subtotal = getTotalPrice();
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + DELIVERY_CHARGE;

  // Load addresses on component mount
  useEffect(() => {
    setMounted(true);
    const loadAddresses = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoadingAddresses(false);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/addresses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          const formattedAddresses = data.addresses.map((addr: any) => ({
            id: addr.id,
            name: addr.fullName,
            phone: addr.phone,
            address: addr.addressLine1,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            isDefault: addr.isDefault,
          }));
          setAddresses(formattedAddresses);

          // Auto-select default address
          const defaultAddr = formattedAddresses.find((a: any) => a.isDefault);
          if (defaultAddr) {
            setSelectedAddress(defaultAddr.id);
          }
        }
      } catch (error) {
        console.error("Failed to load addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, []);

  const handleAddAddress = async () => {
    if (
      !newAddress.name ||
      !newAddress.phone ||
      !newAddress.address ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.pincode
    ) {
      toast.error("Please fill all address fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: newAddress.name,
          phone: newAddress.phone,
          addressLine1: newAddress.address,
          city: newAddress.city,
          state: newAddress.state,
          pincode: newAddress.pincode,
          isDefault: addresses.length === 0, // Make first address default
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save address");
      }

      const result = await response.json();
      const savedAddress = {
        id: result.address.id,
        name: result.address.fullName,
        phone: result.address.phone,
        address: result.address.addressLine1,
        city: result.address.city,
        state: result.address.state,
        pincode: result.address.pincode,
        isDefault: result.address.isDefault,
      };

      setAddresses([...addresses, savedAddress]);
      setSelectedAddress(savedAddress.id);
      setNewAddress({
        name: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      });
      setShowAddressForm(false);
      toast.success("Address saved successfully!");
    } catch (error) {
      console.error("Address save error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save address. Please try again.",
      );
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select or add a delivery address");
      return;
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddress);

    if (!selectedAddr) {
      toast.error("Invalid address selected");
      return;
    }

    setIsPlacingOrder(true);

    const orderData = {
      items,
      address: selectedAddr,
      paymentMethod,
      subtotal,
      tax,
      deliveryCharge: DELIVERY_CHARGE,
      total,
      orderDate: new Date().toISOString(),
      status: paymentMethod === "cod" ? "confirmed" : "pending",
    };

    try {
      // Call backend API to create order
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to place order");
      }

      const result = await response.json();

      if (paymentMethod === "online") {
        // For online payment, show Razorpay checkout
        setPendingOrderId(result.order.id);
        setShowPayment(true);
      } else {
        // For COD, clear cart immediately and show success
        clearCart();
        toast.success("✅ Order placed successfully! We will confirm it soon.");

        // Redirect after a short delay to ensure cart is cleared
        setTimeout(() => {
          router.push("/orders");
        }, 1500);
      }
    } catch (error) {
      console.error("Order placement error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to place order. Please try again.",
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePaymentSuccess = (paymentId: string, orderId: string) => {
    clearCart();
    setShowPayment(false);
    toast.success("✅ Payment successful! Order confirmed.");

    // Redirect to orders page after a short delay
    setTimeout(() => {
      router.push("/orders");
    }, 1500);
  };

  const handlePaymentFailure = (error: any) => {
    console.error("Payment failed:", error);
    toast.error("Payment failed. You can retry payment from your orders page.");
    setShowPayment(false);
    router.push("/orders");
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center py-16">
              <div className="text-6xl mb-4">🛒</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Your Cart is Empty
              </h1>
              <p className="text-gray-600 mb-8">
                Add some premium organic manure to get started!
              </p>
              <Link
                href="/products"
                className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                Continue Shopping
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
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Shopping Cart
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Items in Cart ({items.length})
                </h2>
                <div className="space-y-4 divide-y">
                  {items.map((item) => (
                    <div key={item.productId} className="py-4 flex gap-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                        {item.imageUrl ? (
                          <Image
                            src={fixImageUrl(item.imageUrl) || ""}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                            loading="lazy"
                            quality={75}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            🌱
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Weight: {item.weight}kg
                        </p>
                        <p className="text-lg font-bold text-primary-600 mb-3">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>

                        {/* Quantity Control */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            −
                          </button>
                          <span className="px-4 font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="ml-auto px-4 py-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address Selection */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    📍 Delivery Address
                  </h2>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Add New
                  </button>
                </div>

                {showAddressForm && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Name"
                      value={newAddress.name}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                    <textarea
                      placeholder="Address"
                      value={newAddress.address}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, city: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            state: e.target.value,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={newAddress.pincode}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          pincode: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                    <button
                      onClick={handleAddAddress}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                    >
                      Save Address
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {!mounted ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-blue-800">Loading addresses...</p>
                    </div>
                  ) : addresses.length > 0 ? (
                    addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition ${
                          selectedAddress === addr.id
                            ? "border-primary-600 bg-primary-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddress === addr.id}
                          onChange={() => setSelectedAddress(addr.id)}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {addr.name}
                            {addr.isDefault && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            {addr.address}, {addr.city}, {addr.state} -{" "}
                            {addr.pincode}
                          </p>
                          <p className="text-sm text-gray-600">{addr.phone}</p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-yellow-800 font-semibold">
                        📍 Please add a delivery address to continue
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  💳 Payment Method
                </h2>

                <div className="space-y-3">
                  <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        Cash on Delivery (COD)
                      </p>
                      <p className="text-sm text-gray-600">
                        Pay when your order arrives
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border-2 border-primary-600 bg-primary-50 rounded-lg cursor-pointer transition">
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        Online Payment
                      </p>
                      <p className="text-sm text-gray-600">
                        Credit/Debit Card, UPI, Net Banking
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Order Summary
                </h2>

                <div className="space-y-3 border-b pb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-semibold">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tax (5%):</span>
                    <span className="font-semibold">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Delivery:</span>
                    <span className="font-semibold">
                      ₹{DELIVERY_CHARGE.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="font-bold text-primary-600">
                    ₹{total.toFixed(2)}
                  </span>
                </div>

                {/* Payment Button */}
                {showPayment && pendingOrderId ? (
                  <RazorpayCheckout
                    orderId={pendingOrderId}
                    amount={total}
                    customerName={user?.name || "Customer"}
                    customerEmail={user?.email || ""}
                    customerPhone={
                      addresses.find((a) => a.id === selectedAddress)?.phone ||
                      ""
                    }
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                  />
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg hover:from-primary-700 hover:to-primary-800 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlacingOrder
                      ? "🔄 Placing Order..."
                      : paymentMethod === "online"
                        ? "Proceed to Payment"
                        : "Place Order"}
                  </button>
                )}

                <Link
                  href="/products"
                  className="block text-center text-primary-600 hover:text-primary-700 font-medium"
                >
                  Continue Shopping
                </Link>

                {/* Order Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700 space-y-2">
                  <p>
                    <strong>✓</strong> 100% Organic Products Guaranteed
                  </p>
                  <p>
                    <strong>✓</strong> Fast Delivery within 3-5 days
                  </p>
                  <p>
                    <strong>✓</strong> Money-back Guarantee
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
