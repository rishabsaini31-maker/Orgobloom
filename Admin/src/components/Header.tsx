"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import ProfileDropdown from "./ProfileDropdown";

export default function Header() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Search can be used to filter orders, users, products, etc.
      router.push(`/dashboard?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="bg-white shadow-sm h-20 flex items-center justify-between px-6 border-b border-gray-200">
      <div className="flex items-center gap-6 flex-1">
        <h2 className="text-xl font-semibold text-gray-800 min-w-fit">
          Admin Dashboard
        </h2>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2">
            <input
              type="text"
              placeholder="Search users, orders, products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-100 focus:outline-none text-gray-700 placeholder-gray-500 flex-1 text-sm"
            />
            <button
              type="submit"
              className="text-gray-600 hover:text-primary-600 ml-2"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>

      <div className="flex items-center space-x-4">
        <ProfileDropdown />
      </div>
    </header>
  );
}
