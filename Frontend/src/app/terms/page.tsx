"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function TermsPage() {
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
          Terms of Service
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
              1. Agreement to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using the Orgobloom website and services, you
              accept and agree to be bound by the terms and provision of this
              agreement. If you do not agree to abide by the above, please do
              not use this service.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Use License
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Permission is granted to temporarily download one copy of the
              materials (information or software) on Orgobloom for personal,
              non-commercial transitory viewing only. This is the grant of a
              license, not a transfer of title, and under this license you may
              not:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li>Modifying or copying the materials</li>
              <li>
                Using the materials for any commercial purpose or for any public
                display
              </li>
              <li>
                Attempting to decompile or reverse engineer any software
                contained on Orgobloom
              </li>
              <li>
                Removing any copyright or other proprietary notations from the
                materials
              </li>
              <li>
                Transferring the materials to another person or
                &quot;mirroring&quot; the materials on any other server
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Product Information
            </h2>
            <p className="text-gray-700 leading-relaxed">
              All product descriptions, pricing, and availability information on
              this website are subject to change without notice. Orgobloom
              reserves the right to limit quantities and to discontinue any
              product at any time.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Order Acceptance
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to refuse or cancel any order at our sole
              discretion. Reasons may include product availability, errors in
              pricing, or suspected fraudulent activity.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Pricing and Availability
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>All prices are in Indian Rupees (₹)</li>
              <li>Prices are subject to change without notice</li>
              <li>
                We strive to keep product information accurate and up-to-date
              </li>
              <li>Products are subject to availability</li>
              <li>Errors in pricing will not be honored</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. User Accounts
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you create an account on Orgobloom, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the confidentiality of your password</li>
              <li>
                Accept responsibility for all activities under your account
              </li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not engage in fraudulent or unauthorized transactions</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Payment Terms
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Payment must be received before order shipment (unless COD)
              </li>
              <li>
                We accept credit cards, debit cards, net banking, and COD via
                Razorpay
              </li>
              <li>All payment information is processed securely</li>
              <li>
                By submitting payment, you warrant that you have legal right to
                use the payment method
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              In no case shall Orgobloom, our suppliers, or other parties
              involved in creating, producing, or delivering this site be liable
              for any damages, including without limitation direct, indirect,
              incidental, consequential, punitive, or special damages arising
              out of or related to these terms or the information, materials, or
              merchandise presented on this website, even if advised of the
              possibility of such damages.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Governing Law
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These terms and conditions are governed by and construed in
              accordance with the laws of India, and you irrevocably submit to
              the exclusive jurisdiction of the courts located in India.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> support@orgobloom.com
              </p>
              <p className="text-gray-700">
                <strong>Address:</strong> Orgobloom, India
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
