"use client";

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

type MenuItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

export default function ProfileDropdown() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
    maxHeight: "380px",
    menuHeight: "300px",
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateMobile = () => setIsMobile(mediaQuery.matches);

    updateMobile();
    mediaQuery.addEventListener("change", updateMobile);
    window.addEventListener("resize", updateMobile);

    return () => {
      mediaQuery.removeEventListener("change", updateMobile);
      window.removeEventListener("resize", updateMobile);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !buttonRef.current || isMobile) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const right = Math.max(10, window.innerWidth - rect.right);

    let top = rect.bottom + 8;
    const availableBelow = window.innerHeight - top - 12;
    const availableAbove = rect.top - 12;

    let maxHeight = Math.min(420, Math.max(260, availableBelow));

    if (availableBelow < 280 && availableAbove > availableBelow) {
      maxHeight = Math.min(420, Math.max(260, availableAbove));
      top = Math.max(12, rect.top - maxHeight - 8);
    }

    const headerHeight = headerRef.current?.offsetHeight || 78;
    const menuHeight = Math.max(170, maxHeight - headerHeight);

    setDropdownPosition({
      top,
      right,
      maxHeight: `${maxHeight}px`,
      menuHeight: `${menuHeight}px`,
    });
  }, [isOpen, isMobile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, {
        passive: true,
      });

      if (isMobile) {
        // Simple approach: lock body scroll while modal is open
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
          document.removeEventListener("touchstart", handleClickOutside);
          document.body.style.overflow = originalOverflow;
        };
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, isMobile]);

  const closeDropdown = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  const sections: MenuSection[] = [
    {
      title: "Account",
      items: [
        { label: "My Profile", href: "/profile" },
        { label: "Settings", href: "/profile?tab=settings" },
        { label: "Change Password", href: "/profile?tab=password" },
      ],
    },
    {
      title: "Orders",
      items: [
        { label: "My Orders", href: "/orders" },
        { label: "Track Order", href: "/track-order" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { label: "Saved Addresses", href: "/addresses" },
        { label: "Wishlist", href: "/wishlist" },
      ],
    },
    {
      title: "Support",
      items: [
        { label: "Help & Support", href: "/help" },
        { label: "Contact Us", href: "/contact" },
      ],
    },
    {
      title: "",
      items: [
        {
          label: "Logout",
          onClick: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  const renderMenuItems = () => (
    <>
      {sections.map((section, index) => (
        <div key={`${section.title}-${index}`}>
          {section.title && (
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {section.title}
              </p>
            </div>
          )}

          {section.items.map((item) => {
            const baseClass = `flex items-center px-4 py-2.5 transition-colors ${
              item.danger
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-50"
            }`;

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeDropdown}
                  className={baseClass}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => {
                  closeDropdown();
                  item.onClick?.();
                }}
                className={`w-full text-left ${baseClass}`}
              >
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}

          {index < sections.length - 1 && (
            <div className="border-t border-gray-100 my-2"></div>
          )}
        </div>
      ))}
    </>
  );

  const mobileDropdownContent = (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={closeDropdown}
      />
      <div
        ref={dropdownRef}
        className="fixed left-0 right-0 bottom-0 bg-white z-[9999] flex flex-col"
        style={{
          height: "50vh",
          maxHeight: "500px",
          minHeight: "300px",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header with user info */}
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0 bg-gray-50">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {user.email}
          </p>
          {user.name && (
            <p className="text-xs text-gray-600 mt-0.5">{user.name}</p>
          )}
        </div>

        {/* Scrollable menu area - fixed size */}
        <div
          ref={scrollableRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "smooth",
          }}
        >
          <div className="divide-y divide-gray-100">
            {renderMenuItems()}
          </div>
        </div>
      </div>
    </>
  );

  const desktopDropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed bg-white rounded-xl shadow-2xl z-[9999] border border-gray-200 w-72 max-w-[90vw] flex flex-col overflow-hidden"
      style={{
        top: dropdownPosition.top,
        right: dropdownPosition.right,
        maxHeight: dropdownPosition.maxHeight,
      }}
    >
      <div
        ref={headerRef}
        className="px-4 py-4 border-b border-gray-100 bg-gray-50 rounded-t-xl flex-shrink-0"
      >
        <p className="text-sm text-gray-600">Signed in as</p>
        <p className="text-sm font-semibold text-gray-900 truncate">
          {user.email}
        </p>
        {user.name && (
          <p className="text-sm text-gray-600 mt-1">Name: {user.name}</p>
        )}
      </div>

      <div
        className="overflow-y-auto py-2"
        style={{
          height: dropdownPosition.menuHeight,
          minHeight: 0,
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {renderMenuItems()}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
      >
        <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
          {user.name?.charAt(0).toUpperCase() ||
            user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="text-gray-700 font-medium text-sm hidden lg:inline max-w-[140px] truncate">
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

      {isOpen &&
        mounted &&
        createPortal(
          isMobile ? mobileDropdownContent : desktopDropdownContent,
          document.body,
        )}
    </div>
  );
}
