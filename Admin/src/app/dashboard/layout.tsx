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
  const {
    isAuthenticated,
    user,
    token,
    isHydrated,
    setIsHydrated,
    restoreFromStorage,
  } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [hydrationTimeout, setHydrationTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    if (isHydrated) {
      console.log("[LAYOUT] Store already hydrated");
      return;
    }

    console.log("[LAYOUT] Waiting for store hydration...");

    // Increased timeout for better localStorage loading
    const timer = setTimeout(() => {
      console.log("[LAYOUT] Hydration timeout reached, manually restoring");
      restoreFromStorage();
      setIsHydrated(true);
    }, 300);

    setHydrationTimeout(timer);

    return () => {
      clearTimeout(timer);
    };
  }, [isHydrated, setIsHydrated, restoreFromStorage]);

  // Check auth after hydration
  useEffect(() => {
    if (!isHydrated) {
      console.log("[LAYOUT] Waiting for hydration...");
      return;
    }

    if (authCheckDone) {
      console.log("[LAYOUT] Auth check already completed");
      return;
    }

    console.log("🔍 Dashboard auth check:", {
      token: token ? "exists" : "missing",
      isAuthenticated,
      userRole: user?.role,
      timestamp: new Date().toISOString(),
    });

    // If no token or not authenticated, redirect to login
    if (!token) {
      console.log("❌ No token found, redirecting to login");
      const timeout = setTimeout(() => {
        console.log("⏱️ Executing redirect to login...");
        router.push("/login");
      }, 500);
      setRedirectTimeout(timeout);
      setAuthCheckDone(true);
      return;
    }

    // Check if user has ADMIN role
    if (!user || user.role !== "ADMIN") {
      console.log("❌ User is not ADMIN:", user?.role || "no user data");
      const timeout = setTimeout(() => {
        console.log("⏱️ Executing redirect to login (not admin)...");
        router.push("/login");
      }, 500);
      setRedirectTimeout(timeout);
      setAuthCheckDone(true);
      return;
    }

    console.log("✅ Auth check passed, user:", user.email, "role:", user.role);
    setAuthCheckDone(true);
  }, [isHydrated, token, isAuthenticated, user, router, authCheckDone]);

  // Cleanup redirect timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
      if (hydrationTimeout) clearTimeout(hydrationTimeout);
    };
  }, [redirectTimeout, hydrationTimeout]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [children]);

  // Show loading state while hydrating auth from localStorage
  if (!isHydrated || !authCheckDone) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center">
            <div className="h-12 w-12">
              <div className="animate-spin rounded-full h-full w-full border-4 border-gray-200 border-t-primary-600"></div>
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium">
            Loading dashboard...
          </p>
          <p className="text-gray-500 text-xs">
            {!isHydrated ? "Initializing..." : "Verifying credentials..."}
          </p>
        </div>
      </div>
    );
  }

  // This shouldn't happen if auth check is working, but fallback just in case
  if (!token || !user || user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <p className="text-red-700 font-medium">Access Denied</p>
          <p className="text-red-600 text-sm">
            You don't have permission to access this page. Redirecting to
            login...
          </p>
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
