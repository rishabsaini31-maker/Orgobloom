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
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
    maxHeight: "60vh",
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position and max height for mobile
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Calculate max height: leave 20px padding from edges
      const maxHeightBelow = Math.max(200, spaceBelow - 20);
      const maxHeightAbove = Math.max(200, spaceAbove - 20);

      // Use space below if enough, otherwise use space above
      const shouldShowAbove = spaceBelow < 300 && spaceAbove > spaceBelow;

      const maxHeight = shouldShowAbove
        ? Math.min(maxHeightAbove, window.innerHeight * 0.8)
        : Math.min(maxHeightBelow, window.innerHeight * 0.8);

      const topPosition = shouldShowAbove
        ? rect.top - maxHeight - 8
        : rect.bottom + 8;

      setDropdownPosition({
        top: Math.max(10, topPosition),
        right: Math.max(10, window.innerWidth - rect.right),
        maxHeight: `${maxHeight}px`,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Only close on scroll outside the dropdown
    const handleScroll = (event: Event) => {
      if (isOpen && dropdownRef.current) {
        // Check if the scroll is happening inside the dropdown
        const target = event.target as Node;
        if (!dropdownRef.current.contains(target)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed bg-white rounded-xl shadow-2xl z-[9999] border border-gray-200 w-72 max-w-[90vw] flex flex-col overflow-hidden"
      style={{
        top: dropdownPosition.top,
        right: dropdownPosition.right,
        maxHeight: dropdownPosition.maxHeight,
        height: dropdownPosition.maxHeight,
        overscrollBehavior: "contain",
      }}
    >
      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-100 bg-gray-50 rounded-t-xl flex-shrink-0">
        <p className="text-sm text-gray-600">Signed in as</p>
        <p className="text-sm font-semibold text-gray-900">{user.email}</p>
        {user.name && (
          <p className="text-sm text-gray-600 mt-1">Name: {user.name}</p>
        )}
      </div>

      {/* Menu Items - SCROLLABLE */}
      <div
        className="overflow-y-auto flex-1 py-2 touch-none"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "none",
        }}
        onWheel={(e) => {
          const element = e.currentTarget;
          const isAtTop = element.scrollTop === 0;
          const isAtBottom =
            element.scrollTop + element.clientHeight === element.scrollHeight;

          if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
            e.preventDefault();
          }
        }}
      >
        {/* Account Section */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Account
          </p>
        </div>

        <Link
          href="/profile"
          onClick={() => setIsOpen(false)}
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-3"
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
          <span className="text-sm">My Profile</span>
        </Link>

        <Link
          href="/profile?tab=settings"
          onClick={() => setIsOpen(false)}
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-3"
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
          <span className="text-sm">Settings</span>
        </Link>

        <Link
          href="/profile?tab=password"
          onClick={() => setIsOpen(false)}
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="text-sm">Change Password</span>
        </Link>

        <div className="border-t border-gray-100 my-2"></div>

        {/* Orders Section */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Orders
          </p>
        </div>

        <Link
          href="/orders"
          onClick={() => setIsOpen(false)}
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-3"
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
          <span className="text-sm">My Orders</span>
        </Link>

        <Link
          href="/track-order"
          onClick={() => setIsOpen(false)}
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-3"
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
          <span className="text-sm">Track Order</span>
        </Link>

        <div className="border-t border-gray-100 my-2"></div>

        {/* Preferences Section */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Preferences
          </p>
        </div>

        <Link
          href="/addresses"
          onClick={() => setIsOpen(false)}
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-3"
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
          <span className="text-sm">Saved Addresses</span>
        </Link>

        <Link
          href="/wishlist"
          onClick={() => setIsOpen(false)}
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-3"
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
          <span className="text-sm">Wishlist</span>
        </Link>

        <div className="border-t border-gray-100 my-2"></div>

        {/* Support Section */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Support
          </p>
        </div>

        <Link
          href="/help"
          onClick={() => setIsOpen(false)}
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm">Help & Support</span>
        </Link>

        <Link
          href="/contact"
          onClick={() => setIsOpen(false)}
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm">Contact Us</span>
        </Link>

        <div className="border-t border-gray-100 my-2"></div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
            handleLogout();
          }}
          className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-3"
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
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
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
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
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

      {/* Render dropdown using portal to escape container constraints */}
      {isOpen && mounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}
