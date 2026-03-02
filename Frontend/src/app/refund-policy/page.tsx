"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function RefundPolicyPage() {
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
          Refund & Return Policy
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
              1. Returns & Refunds Overview
            </h2>
            <p className="text-gray-700 leading-relaxed">
              At Orgobloom, customer satisfaction is our top priority. We offer
              a hassle-free 30-day return and refund policy for all products
              purchased through our website. If you are not satisfied with your
              purchase, you can return it for a refund or exchange.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Return Eligibility
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To be eligible for a return, products must meet the following
              criteria:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Returned within 30 days of purchase</li>
              <li>In original, unused condition with original packaging</li>
              <li>Product must not show signs of wear or damage</li>
              <li>All accessories and documentation included</li>
              <li>Receipt or order confirmation must be provided</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Non-Returnable Items
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The following items are non-returnable:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Opened or used products</li>
              <li>Products without original packaging</li>
              <li>Items damaged due to customer misuse</li>
              <li>Perishable or consumable goods</li>
              <li>Customized or personalized products</li>
              <li>Clearance or final sale items</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Return Process
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 1: Initiating a Return
                </h3>
                <p className="text-gray-700">
                  Contact our customer support team at support@orgobloom.com
                  with your order number and reason for return. We will provide
                  you with return instructions and a return authorization
                  number.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 2: Prepare Your Return
                </h3>
                <p className="text-gray-700">
                  Pack the product securely in its original packaging (if
                  possible). Include the return authorization number and all
                  original accessories and documentation.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 3: Ship Your Return
                </h3>
                <p className="text-gray-700">
                  Ship the package to the return address provided. We recommend
                  using a trackable shipping method. The cost of return shipping
                  is the responsibility of the customer, unless the return is
                  due to our error or defective product.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 4: Inspection & Processing
                </h3>
                <p className="text-gray-700">
                  Once received, we will inspect the product to verify it meets
                  return eligibility criteria. We will notify you of the
                  inspection result within 5-7 business days.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 5: Refund Processing
                </h3>
                <p className="text-gray-700">
                  Upon approval, your refund will be processed within 7-10
                  business days. Refunds will be credited to your original
                  payment method.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Refund Amount
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Refund amounts are calculated as follows:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Full refund of product price and taxes</li>
              <li>Shipping charges are non-refundable</li>
              <li>
                Return shipping cost is customer&apos;s responsibility (unless
                our error)
              </li>
              <li>Delivery charges are non-refundable</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Damaged or Defective Products
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you receive a damaged, defective, or incorrect product, please
              contact our customer support team immediately with photos of the
              damage or defect. We will replace the product or provide a full
              refund at no cost, including return shipping. You must report
              damaged items within 48 hours of delivery.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Exchanges
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you wish to exchange a product for a different size, color, or
              model, please contact our support team. We will arrange an
              exchange at no additional cost if the new product is the same
              price. If the new product costs more, you will be charged the
              difference; if it costs less, the difference will be refunded.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Cancellations
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Orders can be cancelled before shipment for a full refund. Once an
              order has been shipped, you must follow the return process
              outlined above. Cancellation requests should be submitted within
              24 hours of order placement.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about our refund or return policy, please
              contact us:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> support@orgobloom.com
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
