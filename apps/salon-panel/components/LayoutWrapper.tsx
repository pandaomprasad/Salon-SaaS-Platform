"use client";

import Sidebar from "@/components/layout/Sidebar";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { useEffect, useState } from "react";
import { tokenStorage } from "@/lib/api-client";
import { pathnameToPage, canAccess } from "@/lib/rbac";
import type { UserRole } from "@/lib/api";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const { user, salon, isLoading } = useSelector(
    (state: RootState) => state.auth,
  );

  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPage = pathnameToPage(pathname);
  const hideSidebar = pathname === "/login";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !isLoading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, isLoading, pathname, router, mounted]);

  // Redirect if user doesn't have access to current page
  useEffect(() => {
    if (mounted && !isLoading && user && pathname !== "/login") {
      const role = user.role as UserRole;
      if (!canAccess(role, currentPage)) {
        router.replace("/dashboard");
      }
    }
  }, [user, isLoading, pathname, currentPage, router, mounted]);

  if (!mounted || isLoading) return null;

  if (!user && pathname !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="text-ash text-sm">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar */}
      {!hideSidebar && user && (
        <Sidebar
          currentPage={currentPage}
          role={user.role as UserRole}
          name={user.name}
          email={user.email}
          initials={user.initials}
          salonName={salon?.name || "Salon"}
          isOpen={sidebarOpen}
          onNavigate={(page) => {
            router.push(`/${page}`);
            setSidebarOpen(false);
          }}
          onLogout={() => {
            tokenStorage.clearTokens();
            dispatch(logout());
            router.replace("/login");
          }}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content — offset for sidebar on desktop */}
      {!hideSidebar && user ? (
        <div className="lg:ml-56 flex flex-col min-h-screen">
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}