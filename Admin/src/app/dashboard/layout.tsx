"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, token } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    // Use a short timeout to ensure hydration is complete
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Check auth after hydration
  useEffect(() => {
    if (!isHydrated) return;

    console.log("🔍 Dashboard auth check:", {
      token: token ? "exists" : "missing",
      isAuthenticated,
      userRole: user?.role,
    });

    // If no token or not authenticated, redirect to login
    if (!token) {
      console.log("❌ No token, redirecting to login");
      router.push("/login");
      return;
    }

    // Check if user has ADMIN role
    if (user?.role !== "ADMIN") {
      console.log("❌ User is not ADMIN:", user?.role);
      router.push("/login");
      return;
    }

    console.log("✅ Auth check passed");
  }, [isHydrated, token, isAuthenticated, user, router]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [children]);

  // Show loading state while hydrating auth from localStorage
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting unauthorized users
  if (!token || !user || user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - responsive */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
