"use client";

import Sidebar from "@/components/layout/Sidebar";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { useEffect, useState } from "react";
import { getCurrentPage, getUserRole } from "@/lib/mapUser";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const { user, salon } = useSelector((state: RootState) => state.auth);

  const [mounted, setMounted] = useState(false);

  const currentPage = getCurrentPage(pathname);
  const hideSidebar = pathname === "/login";

  // ✅ Ensure client-side rendering only
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔐 Redirect if not logged in
  useEffect(() => {
    if (mounted && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, pathname, router, mounted]);

  // ⛔ Prevent hydration mismatch
  if (!mounted) return null;

  // ⛔ Show fallback while redirecting
  if (!user && pathname !== "/login") {
    return (
      <div className="p-5">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      {!hideSidebar && user && (
        <div className="w-64 shrink-0">
          <Sidebar
            currentPage={currentPage}
            role={getUserRole(user.role)}
            name={user.name}
            email={user.email}
            initials={user.initials}
            salonName={salon?.name || "Salon"}
            isOpen={true}
            onNavigate={(page) => router.push(`/${page}`)}
            onLogout={() => {
              localStorage.removeItem("token");
              dispatch(logout());
              router.replace("/login");
            }}
            onClose={() => {}}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}