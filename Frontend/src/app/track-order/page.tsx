"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackOrderPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    // Simulate API call
    setTimeout(() => {
      if (trackingNumber.toUpperCase().startsWith("ORG")) {
        setOrderData({
          orderNumber: trackingNumber.toUpperCase(),
          status: "shipped",
          estimatedDelivery: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000,
          ).toLocaleDateString(),
          trackingSteps: [
            { step: "Order Confirmed", completed: true, date: "2025-02-14" },
            { step: "Processing", completed: true, date: "2025-02-15" },
            { step: "Shipped", completed: true, date: "2025-02-16" },
            { step: "In Transit", completed: true, date: "2025-02-17" },
            {
              step: "Delivered",
              completed: false,
              date: "Expected: 2025-02-19",
            },
          ],
        });
      } else {
        setOrderData(null);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors mb-8"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Track Your Order
              </h1>
              <p className="text-gray-600">
                Enter your order number to track its status
              </p>
            </div>

            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-lg shadow-md p-8 mb-8"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter order number (e.g., ORG-2025-001)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-semibold"
                >
                  {loading ? "Searching..." : "Track"}
                </button>
              </div>
            </form>

            {/* Results */}
            {searched && (
              <div className="bg-white rounded-lg shadow-md p-8">
                {orderData ? (
                  <>
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-gray-800">
                          {orderData.orderNumber}
                        </h2>
                        <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                          {orderData.status.charAt(0).toUpperCase() +
                            orderData.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        Estimated Delivery:{" "}
                        <span className="font-semibold text-gray-800">
                          {orderData.estimatedDelivery}
                        </span>
                      </p>
                    </div>

                    {/* Tracking Steps */}
                    <div className="space-y-0">
                      {orderData.trackingSteps.map(
                        (item: any, index: number) => (
                          <div key={index} className="flex gap-4 pb-8 relative">
                            {/* Timeline Line */}
                            {index < orderData.trackingSteps.length - 1 && (
                              <div
                                className={`absolute left-6 top-12 w-0.5 h-12 ${
                                  item.completed
                                    ? "bg-primary-600"
                                    : "bg-gray-300"
                                }`}
                              ></div>
                            )}

                            {/* Dot */}
                            <div
                              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                                item.completed
                                  ? "bg-primary-600"
                                  : "bg-gray-300"
                              }`}
                            >
                              {item.completed ? "✓" : index + 1}
                            </div>

                            {/* Content */}
                            <div className="pt-1">
                              <h3
                                className={`font-semibold ${item.completed ? "text-gray-800" : "text-gray-600"}`}
                              >
                                {item.step}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {item.date}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-gray-600 mb-4">Order not found</p>
                    <p className="text-sm text-gray-500">
                      Please check your order number and try again
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Info Box */}
            {!searched && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                <p className="text-primary-900">
                  💡 <span className="font-semibold">Tip:</span> You can find
                  your order number in the order confirmation email or in "My
                  Orders" section
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
