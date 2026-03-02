"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>

        {/* Last Updated */}
        <p className="text-gray-600 mb-8">
          <strong>Last Updated:</strong> March 2, 2026
        </p>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Orgobloom (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is
              committed to protecting your privacy. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when
              you visit our website and use our services.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Personal Information
                </h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Name and email address</li>
                  <li>Phone number</li>
                  <li>Delivery address</li>
                  <li>Payment information (processed securely by Razorpay)</li>
                  <li>Account preferences</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Usage Information
                </h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Browsing history and products viewed</li>
                  <li>Search queries</li>
                  <li>Device information (IP address, browser type)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Send transactional emails and SMS</li>
              <li>Provide customer support</li>
              <li>Improve our website and services</li>
              <li>Detect and prevent fraud</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Data Protection
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. This includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li>Encryption of sensitive data</li>
              <li>Secure password storage (bcrypt)</li>
              <li>HTTPS for all communications</li>
              <li>Regular security audits</li>
              <li>Limited employee access</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Sharing Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We do not sell, trade, or rent your personal information. We may
              share your information with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li>Payment processors (Razorpay)</li>
              <li>Shipping partners (Delhivery, Shiprocket, F Ship)</li>
              <li>Email service providers (Nodemailer)</li>
              <li>Law enforcement (when legally required)</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Your Rights
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account</li>
              <li>Opt-out of marketing communications</li>
              <li>Request data portability</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Contact us at support@orgobloom.com to exercise these rights.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Cookies
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies to enhance your browsing experience, remember your
              preferences, and track website performance. You can control cookie
              settings in your browser.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy, please contact
              us:
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

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Changes to This Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by updating the &quot;Last Updated&quot;
              date above. Your continued use of our services after changes
              constitutes your acceptance of the updated policy.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
