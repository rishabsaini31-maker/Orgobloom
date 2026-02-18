"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SupportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("faq");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqData = [
    {
      question: "How do I place an order?",
      answer:
        "Browse our products, add items to your cart, and proceed to checkout. Fill in your delivery details and payment information to complete your order.",
    },
    {
      question: "What is your return policy?",
      answer:
        "We offer a 7-day return policy for all products in their original condition. Damaged items can be claimed within 48 hours of delivery.",
    },
    {
      question: "Do you offer free shipping?",
      answer:
        "Yes! We offer free shipping on orders above ₹500. For orders below ₹500, shipping charges apply based on your location.",
    },
    {
      question: "How can I track my order?",
      answer:
        "Once your order is shipped, you'll receive a tracking link via email. You can also check the status in your order history.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept credit cards, debit cards, UPI, net banking, and digital wallets. All payments are secured with SSL encryption.",
    },
    {
      question: "Are your products organic certified?",
      answer:
        "Yes, all our products are certified organic and sourced from verified sustainable farms. Each product comes with certification details.",
    },
    {
      question: "How do I contact customer support?",
      answer:
        "You can reach us via email, phone, or our contact form. Our support team responds within 24 hours.",
    },
    {
      question: "Do you deliver outside India?",
      answer:
        "Currently, we deliver within India only. We're expanding to international markets soon.",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Your message has been sent! We'll respond shortly.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors mb-6"
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
          <h1 className="text-4xl font-bold mb-4">Support & Help Center</h1>
          <p className="text-lg opacity-90">
            We're here to help! Find answers to common questions or contact our
            support team.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {[
            { id: "faq", label: "❓ FAQs" },
            { id: "contact", label: "📧 Contact Us" },
            { id: "guides", label: "📖 Guides" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FAQ Tab */}
        {activeTab === "faq" && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqData.map((item, index) => (
                <details
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
                >
                  <summary className="cursor-pointer font-medium text-gray-900 flex items-center justify-between">
                    {item.question}
                    <span className="text-primary-600">+</span>
                  </summary>
                  <p className="text-gray-600 mt-4 leading-relaxed">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === "contact" && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Contact Info */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">📍</span> Address
                  </h3>
                  <p className="text-gray-600 text-sm">
                    123 Organic Lane
                    <br />
                    Green City, GC 12345
                    <br />
                    India
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">📞</span> Phone
                  </h3>
                  <p className="text-gray-600 text-sm">
                    <a
                      href="tel:+919876543210"
                      className="hover:text-primary-600"
                    >
                      +91 98765 43210
                    </a>
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">✉️</span> Email
                  </h3>
                  <p className="text-gray-600 text-sm">
                    <a
                      href="mailto:support@orgobloom.com"
                      className="hover:text-primary-600"
                    >
                      support@orgobloom.com
                    </a>
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">🕐</span> Working Hours
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Mon - Fri: 9:00 AM - 6:00 PM
                    <br />
                    Sat: 10:00 AM - 4:00 PM
                    <br />
                    Sun: Closed
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg p-6 border border-gray-200 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    placeholder="Your message here..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Guides Tab */}
        {activeTab === "guides" && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">Help Guides & Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Getting Started",
                  description:
                    "Learn how to create an account and place your first order",
                  icon: "🚀",
                },
                {
                  title: "Order Management",
                  description:
                    "Track orders, manage delivery, and handle returns",
                  icon: "📦",
                },
                {
                  title: "Payment & Billing",
                  description:
                    "Understanding payment methods, invoices, and receipts",
                  icon: "💳",
                },
                {
                  title: "Product Information",
                  description:
                    "Learn about organic certifications and product quality",
                  icon: "🌱",
                },
                {
                  title: "Shipping & Delivery",
                  description:
                    "Shipping rates, delivery times, and tracked deliveries",
                  icon: "🚚",
                },
                {
                  title: "Account & Privacy",
                  description:
                    "Manage your profile, passwords, and privacy settings",
                  icon: "🔒",
                },
              ].map((guide, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="text-3xl mb-2">{guide.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{guide.description}</p>
                </div>
              ))}
            </div>

            {/* Additional Links */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">
                Need More Help?
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <Link
                    href="/contact"
                    className="text-primary-600 hover:underline"
                  >
                    📧 Contact us directly
                  </Link>
                </p>
                <p>
                  <Link
                    href="/track-order"
                    className="text-primary-600 hover:underline"
                  >
                    📍 Track your order
                  </Link>
                </p>
                <p>
                  <Link href="/" className="text-primary-600 hover:underline">
                    🏠 Return to home
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
