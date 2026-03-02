"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

export default function ProfileDropdown() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !(event.target as Element)?.closest("[data-dropdown-menu]")
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!user) return null;

  const menuItems = (
    <>
      <Link
        href="/profile"
        onClick={() => setIsOpen(false)}
        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <svg
          className="w-5 h-5 mr-3 text-primary-600"
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
        <span>My Profile</span>
      </Link>

      <Link
        href="/orders"
        onClick={() => setIsOpen(false)}
        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <svg
          className="w-5 h-5 mr-3 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <span>My Orders</span>
      </Link>

      <Link
        href="/track-order"
        onClick={() => setIsOpen(false)}
        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <svg
          className="w-5 h-5 mr-3 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span>Track Order</span>
      </Link>

      <Link
        href="/wishlist"
        onClick={() => setIsOpen(false)}
        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <svg
          className="w-5 h-5 mr-3 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span>Wishlist</span>
      </Link>

      <Link
        href="/profile?tab=settings"
        onClick={() => setIsOpen(false)}
        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <svg
          className="w-5 h-5 mr-3 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>Settings</span>
      </Link>

      <div className="border-t border-gray-100 my-2"></div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(false);
          handleLogout();
        }}
        className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <svg
          className="w-5 h-5 mr-3"
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
        <span>Logout</span>
      </button>
    </>
  );

  // Mobile bottom sheet
  const mobileMenu = isOpen &&
    mounted &&
    createPortal(
      <div className="fixed inset-0 z-50 flex items-end md:hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 animate-in fade-in-0"
          onClick={() => setIsOpen(false)}
        />

        {/* Bottom Sheet */}
        <div
          data-dropdown-menu
          className="relative w-full bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-0 duration-300"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                {user.name?.charAt(0).toUpperCase() ||
                  user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-900">
                  {user.email}
                </p>
                {user.name && (
                  <p className="text-xs text-gray-600">{user.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="px-4 py-3 pb-6 space-y-2 max-h-[60vh] overflow-y-auto">
            {menuItems}
          </div>
        </div>
      </div>,
      document.body,
    );

  // Desktop dropdown
  const desktopMenu = isOpen &&
    mounted &&
    createPortal(
      <div
        data-dropdown-menu
        className="hidden md:block fixed bg-white rounded-xl shadow-2xl border border-gray-200 w-72 z-50 animate-in fade-in-0 zoom-in-95 duration-200 origin-top-right"
        style={{
          top: buttonRef.current
            ? buttonRef.current.getBoundingClientRect().bottom + 8
            : 0,
          right: buttonRef.current
            ? window.innerWidth - (buttonRef.current.getBoundingClientRect().right || 0)
            : 0,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* User Info Header */}
        <div className="px-4 py-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <p className="text-sm text-gray-600">Signed in as</p>
          <p className="text-sm font-semibold text-gray-900">{user.email}</p>
          {user.name && (
            <p className="text-sm text-gray-600 mt-1">Name: {user.name}</p>
          )}
        </div>

        {/* Menu items */}
        <div className="py-2">{menuItems}</div>
      </div>,
      document.body,
    );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
      >
        <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
          {user.name?.charAt(0).toUpperCase() ||
            user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="text-gray-700 font-medium text-sm hidden lg:inline">
          {user.name || user.email}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Render both menus - CSS media queries will show/hide */}
      {mobileMenu}
      {desktopMenu}
    </div>
  );
}
