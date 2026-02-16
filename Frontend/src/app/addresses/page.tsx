"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([
    {
      id: "1",
      name: "Home",
      phone: "9876543210",
      address: "123 Garden Lane",
      city: "Delhi",
      state: "DL",
      pincode: "110001",
      isDefault: true,
    },
  ]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors mb-6"
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Saved Addresses
                </h1>
                <p className="text-gray-600">Manage your delivery addresses</p>
              </div>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold">
                + Add New Address
              </button>
            </div>

            {/* Address List */}
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {addr.name}
                        </h3>
                        {addr.isDefault && (
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{addr.address}</p>
                      <p className="text-gray-600 mb-1">
                        {addr.city}, {addr.state} {addr.pincode}
                      </p>
                      <p className="text-gray-600 text-sm">
                        Phone: {addr.phone}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 border border-primary-600 rounded transition-colors">
                        Edit
                      </button>
                      <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-600 rounded transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {addresses.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600 mb-4">No saved addresses yet</p>
                <Link
                  href="/profile"
                  className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add Address
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
