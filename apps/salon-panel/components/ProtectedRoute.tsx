"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { UserRole } from "@/lib/api";
import { canAccess, type AppPage } from "@/lib/rbac";

interface ProtectedRouteProps {
  children: React.ReactNode;
  page?: AppPage;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  page,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isLoading) return;

    const token = localStorage.getItem("token");
    if (!token || !user) {
      router.push("/login");
      return;
    }

    const role = user.role as UserRole;

    // Check page-level access from RBAC config
    if (page && !canAccess(role, page)) {
      router.push("/dashboard");
      return;
    }

    // Check custom role whitelist if provided
    if (allowedRoles && !allowedRoles.includes(role)) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router, page, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-ash text-sm">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}