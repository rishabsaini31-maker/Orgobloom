"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function HelpPage() {
  const router = useRouter();
  const faqs = [
    {
      question: "How do I track my order?",
      answer:
        'You can track your order by visiting the "Track Order" page and entering your order number. You\'ll see real-time updates about your shipment status.',
    },
    {
      question: "What is your return policy?",
      answer:
        "We offer a 30-day return policy. If you're not satisfied with your purchase, you can initiate a return within 30 days of delivery.",
    },
    {
      question: "How long does shipping take?",
      answer:
        "Shipping typically takes 3-5 business days. For bulk orders, it may take up to 7 business days. You'll receive tracking updates once your order ships.",
    },
    {
      question: "Do you offer bulk discounts?",
      answer:
        "Yes! We offer special pricing for bulk orders. Please contact our sales team at sales@orgobloom.com for a custom quote.",
    },
    {
      question: "Are your products certified organic?",
      answer:
        "All our products are certified organic and follow strict quality standards. Each batch is tested for purity and efficacy.",
    },
    {
      question: "How can I get a refund?",
      answer:
        "Refunds are processed within 5-7 business days after we receive your returned items. You'll receive the refund to your original payment method.",
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
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
                Help & Support
              </h1>
              <p className="text-gray-600">Find answers to common questions</p>
            </div>

            {/* FAQs */}
            <div className="space-y-4 mb-12">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 p-6 cursor-pointer group"
                >
                  <summary className="font-semibold text-gray-800 flex items-center justify-between">
                    {faq.question}
                    <svg
                      className="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </summary>
                  <p className="text-gray-600 mt-4">{faq.answer}</p>
                </details>
              ))}
            </div>

            {/* Contact Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Didn't find your answer?
              </h2>
              <p className="text-gray-600 mb-6">
                Our support team is here to help you
              </p>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <span className="font-semibold">Email:</span>{" "}
                  support@orgobloom.com
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Phone:</span> +91 XXXXX XXXXX
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Hours:</span> Mon-Fri, 9:00 AM
                  - 6:00 PM IST
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
