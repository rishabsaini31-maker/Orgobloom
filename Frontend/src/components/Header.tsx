"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import ProfileDropdown from "./ProfileDropdown";

export default function Header() {
  const { user, isAuthenticated } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const cartCount = getTotalItems();

  // Wait for hydration to prevent mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setMobileSearchOpen(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/support", label: "Support" },
  ];

  return (
    <>
      {/* Only render after hydration to avoid SSR mismatch */}
      {isHydrated && (
        <header className="bg-white/95 backdrop-blur-md shadow-md fixed top-0 left-0 w-full z-50 transition-all duration-300">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Logo */}
              <Link
                href="/"
                className="flex items-center flex-shrink-0 overflow-hidden bg-white/95 rounded-lg"
              >
                <Image
                  src="/images/logo.jpg"
                  alt="Orgobloom Logo"
                  width={290}
                  height={270}
                  className="object-contain w-[100px] h-[50px] md:w-[80px] md:h-[100px] lg:w-[200px] lg:h-[80px] mix-blend-multiply"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-700 hover:text-primary-600 font-medium text-sm lg:text-base transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Desktop Search */}
              <form
                onSubmit={handleSearch}
                className="hidden md:flex items-center"
              >
                <div className="relative flex items-center">
                  <svg
                    className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none"
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
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border-2 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-gray-700 placeholder-gray-500 w-40 lg:w-56 xl:w-64 text-sm pl-10 pr-4 py-2 rounded-lg transition-all"
                  />
                </div>
              </form>

              {/* Actions */}
              <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
                {/* Mobile Search Toggle */}
                <button
                  onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                  className="md:hidden text-gray-700 p-2"
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

                {/* Cart */}
                <Link href="/cart" className="relative p-2">
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-0 -right-0 bg-primary-600 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Auth Buttons - Desktop */}
                <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
                  {!isHydrated ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  ) : isAuthenticated ? (
                    <ProfileDropdown />
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="text-gray-700 hover:text-primary-600 font-medium text-sm"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="bg-primary-600 text-white px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg hover:bg-primary-700 text-sm font-medium"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden text-gray-700 p-2"
                >
                  {mobileMenuOpen ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Search Bar */}
      <div
        className={`md:hidden border-t border-gray-200 bg-white px-4 overflow-hidden transition-all duration-300 ease-out fixed top-16 left-0 right-0 z-40 shadow-md ${mobileSearchOpen ? "max-h-20 opacity-100 py-3" : "max-h-0 opacity-0 py-0"}`}
      >
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
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
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-gray-300 focus:border-primary-500 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            Search
          </button>
        </form>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden border-t border-gray-200 bg-white overflow-hidden transition-all duration-500 ease-out fixed top-16 left-0 right-0 z-40 shadow-lg ${mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <nav className="container mx-auto px-4 py-4">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-4 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-lg font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Auth Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {!isHydrated ? (
              <div className="flex gap-3 px-4">
                <div className="flex-1 h-10 bg-gray-200 animate-pulse rounded"></div>
                <div className="flex-1 h-10 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user?.name || "User"}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  My Profile
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  My Orders
                </Link>
                <Link
                  href="/addresses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Addresses
                </Link>
                <button
                  onClick={() => {
                    useAuthStore.getState().logout();
                    setMobileMenuOpen(false);
                    router.push("/");
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-3 px-4">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 border border-primary-600 text-primary-600 rounded-lg font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 bg-primary-600 text-white rounded-lg font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
