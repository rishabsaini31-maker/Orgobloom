"use client";

import { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";

interface PermissionGateProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export default function PermissionGate({
  children,
  allowedRoles,
  fallback = null,
}: PermissionGateProps) {
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase();
  const allowed = allowedRoles.map((role) => role.toUpperCase());

  if (!userRole || !allowed.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
