"use client";

// Mobile profile dropdown - Chrome-style fixed-size menu
// Deployed with fixed 50vh height for better mobile scrolling

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

  const lockBodyScroll = () => {
    const body = document.body;
    const currentLocks = Number(body.dataset.scrollLocks || "0");
    const nextLocks = currentLocks + 1;
    body.dataset.scrollLocks = String(nextLocks);

    if (nextLocks === 1) {
      body.style.overflow = "hidden";
    }
  };

  const unlockBodyScroll = () => {
    const body = document.body;
    const currentLocks = Number(body.dataset.scrollLocks || "0");
    const nextLocks = Math.max(0, currentLocks - 1);

    if (nextLocks === 0) {
      body.style.overflow = "";
      delete body.dataset.scrollLocks;
      return;
    }

    body.dataset.scrollLocks = String(nextLocks);
  };

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

  // Lock body scroll when mobile dropdown is open
  useEffect(() => {
    if (isOpen && isMobile) {
      lockBodyScroll();

      return () => {
        unlockBodyScroll();
      };
    }
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
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

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
            <div className="px-4 py-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {section.title}
              </p>
            </div>
          )}

          {section.items.map((item) => {
            const baseClass = `flex items-center px-4 py-1.5 transition-colors ${
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
                  <span className="text-xs font-medium">{item.label}</span>
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
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}

          {index < sections.length - 1 && (
            <div className="border-t border-gray-100 my-1"></div>
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
        className="fixed left-0 right-0 bottom-0 bg-white z-[9999]"
        style={{
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          height: "80vh",
          maxHeight: "80vh",
          pointerEvents: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div
          style={{
            padding: "12px 0 8px",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "40px",
              height: "4px",
              backgroundColor: "#d1d5db",
              borderRadius: "2px",
              margin: "0 auto",
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            flexShrink: 0,
          }}
        >
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px" }}>
            Signed in as
          </p>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#111827",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </p>
          {user.name && (
            <p
              style={{
                fontSize: "12px",
                color: "#4b5563",
                margin: "4px 0 0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.name}
            </p>
          )}
        </div>

        {/* Menu - SCROLLABLE CONTAINER */}
        <div
          ref={scrollableRef}
          style={{
            height: "70vh",
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: 0,
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            position: "relative",
            touchAction: "pan-y",
            background: "#fff",
          }}
        >
          <div style={{ padding: "8px 0", minHeight: "100px" }}>
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
        className="overflow-y-auto py-2 dropdown-scroll-container"
        style={{
          height: dropdownPosition.menuHeight,
          minHeight: 0,
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
