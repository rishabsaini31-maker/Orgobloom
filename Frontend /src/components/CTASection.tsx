"use client";

import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Garden?
          </h2>

          <p className="text-lg md:text-xl mb-8 text-primary-100">
            Join thousands of gardeners using Orgobloom organic fertilizers
          </p>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Explore Products Now
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
