"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function ShippingPolicyPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12">
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

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Shipping Policy
        </h1>

        {/* Last Updated */}
        <p className="text-gray-600 mb-8">
          <strong>Effective Date:</strong> March 2, 2026
        </p>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Shipping Overview
            </h2>
            <p className="text-gray-700 leading-relaxed">
              At Orgobloom, we partner with India&apos;s leading logistics
              providers to ensure your orders are delivered safely and on time.
              We offer fast, affordable shipping across India with real-time
              tracking.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Shipping Partners
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the following logistics partners for delivery:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Delhivery:</strong> Primary carrier for pan-India
                coverage
              </li>
              <li>
                <strong>Shiprocket:</strong> Multi-carrier aggregation for
                flexibility
              </li>
              <li>
                <strong>F-Ship:</strong> Specialized courier for high-value
                items
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Shipping Charges
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Shipping charges are calculated based on:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Delivery location (within India)</li>
              <li>Product weight and dimensions</li>
              <li>Selected shipping method</li>
              <li>Promotional offers and discounts</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Free shipping is available on orders above ₹500 in most locations.
              Exact shipping charges will be displayed at checkout.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Delivery Timeframes
            </h2>
            <div className="space-y-4">
              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Metro Cities (Delhi, Mumbai, Bangalore, Chennai, Hyderabad)
                </h3>
                <p className="text-gray-700">Standard Delivery: 1-2 days</p>
                <p className="text-gray-700">
                  Express Delivery: Same day (if ordered before 2 PM)
                </p>
              </div>

              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Major Cities
                </h3>
                <p className="text-gray-700">
                  Standard Delivery: 2-3 business days
                </p>
              </div>

              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Tier 2 & 3 Cities
                </h3>
                <p className="text-gray-700">
                  Standard Delivery: 3-5 business days
                </p>
              </div>

              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Remote Areas
                </h3>
                <p className="text-gray-700">
                  Standard Delivery: 5-7 business days
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Order Processing
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Orders are processed within 24 hours of payment confirmation
              </li>
              <li>Processing happens Monday-Saturday (excluding holidays)</li>
              <li>
                You will receive a shipping confirmation email with tracking
                details
              </li>
              <li>Delivery dates are estimates and not guaranteed</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Tracking Your Order
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Once your order ships, you can track it:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Via our website using your order ID</li>
              <li>Via SMS alerts from the logistics partner</li>
              <li>Via the logistics partner&apos;s tracking portal</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Payment on Delivery (COD)
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For Cash on Delivery orders:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Payment is made directly to the delivery agent</li>
              <li>Please keep exact change ready</li>
              <li>Payment methods: Cash only (unless agreed otherwise)</li>
              <li>A receipt will be provided upon payment</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Delivery Address Requirements
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Please ensure your delivery address includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Full address with street name and number</li>
              <li>City, state, and pin code</li>
              <li>Recipient&apos;s name and phone number</li>
              <li>Nearby landmarks (if available)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Incorrect addresses may result in delivery delays or failed
              deliveries. You will be responsible for additional shipping
              charges if redelivery is required.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Delivery Issues
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Missed Delivery
                </h3>
                <p className="text-gray-700">
                  If the delivery agent cannot find your address or you&apos;re
                  not available, they will attempt redelivery within the next
                  2-3 days. You will receive an SMS notification.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Damaged Package
                </h3>
                <p className="text-gray-700">
                  If your package arrives damaged, please photograph the damage
                  and contact us immediately at support@orgobloom.com. We will
                  arrange for replacement or refund.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Lost Package
                </h3>
                <p className="text-gray-700">
                  If your package is lost, we will file a claim with the
                  logistics partner and provide you with a replacement or refund
                  within 7-10 business days.
                </p>
              </div>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. International Shipping
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Currently, Orgobloom only ships within India. International
              shipping will be available soon. Follow our website for updates.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed">
              For shipping-related inquiries, please contact us:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> support@orgobloom.com
              </p>
              <p className="text-gray-700">
                <strong>Phone:</strong> Available during business hours
              </p>
              <p className="text-gray-700">
                <strong>Response Time:</strong> Within 24 hours
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
