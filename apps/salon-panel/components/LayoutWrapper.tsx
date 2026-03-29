"use client";

import Sidebar from "@/components/layout/Sidebar";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { useEffect } from "react";
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

  const currentPage = getCurrentPage(pathname);
  const hideSidebar = pathname === "/login";

  // 🔐 Redirect if not logged in
  useEffect(() => {
    if (!user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, pathname, router]);

  // 🛑 Prevent rendering before redirect
  if (!user && pathname !== "/login") {
    return (
      <div style={{ padding: "20px" }}>
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
              router.push("/login");
            }}
            onClose={() => {}}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">{children}</div>
    </div>
  );
}
