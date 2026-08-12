"use client";

import Sidebar from "@/components/layout/Sidebar";
import BranchSelectorModal from "@/components/BranchSelectorModal";
import NoBranchModal from "@/components/NoBranchModal";
import BranchTopBar from "@/components/BranchTopBar";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { useEffect, useState } from "react";
import BookingNotificationToast from "@/components/ui/BookingNotificationToast";
import { tokenStorage } from "@/lib/api-client";
import { pathnameToPage, canAccess } from "@/lib/rbac";
import type { UserRole } from "@/lib/api";
import apiClient from "@/lib/api-client";
import { clearUnreadCountCache } from "@/api/services/notificationService";

// Public routes — accessible without an authenticated session
const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const { user, salon, selectedBranch, isLoading } = useSelector(
    (state: RootState) => state.auth,
  );

  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPage = pathnameToPage(pathname);
  const hideSidebar = PUBLIC_PATHS.has(pathname);

  const [adminBlock, setAdminBlock] = useState<{ blocked: boolean; reason: string | null }>({ blocked: false, reason: null });

  useEffect(() => {
  if (!user || PUBLIC_PATHS.has(pathname)) return;

  // Only check once per session, not on every navigation
  if (adminBlock.blocked !== undefined && sessionStorage.getItem("salon_status_checked")) return;

  async function checkSalonStatus() {
    try {
      const salonId = salon?._id;
      if (!salonId) return;

      const { data } = await apiClient.get(`/salon-status/${salonId}`);
      if (data.data?.deactivatedByAdmin) {
        setAdminBlock({ blocked: true, reason: data.data.reason });
      } else {
        setAdminBlock({ blocked: false, reason: null });
      }
      sessionStorage.setItem("salon_status_checked", "true");
    } catch {
      // silent
    }
  }

  checkSalonStatus();
}, [user, salon]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !user && !PUBLIC_PATHS.has(pathname)) {
      router.replace("/login");
    }
  }, [user, isLoading, pathname, router, mounted]);

  useEffect(() => {
    if (mounted && !isLoading && user && !PUBLIC_PATHS.has(pathname)) {
      const role = user.role as UserRole;
      if (!canAccess(role, currentPage)) {
        router.replace("/dashboard");
      }
    }
  }, [user, isLoading, pathname, currentPage, router, mounted]);

  if (!mounted || isLoading) return null;

  if (!user && !PUBLIC_PATHS.has(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex items-center gap-2 text-muted">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {!hideSidebar && user && (
        <Sidebar
          currentPage={currentPage}
          role={user.role as UserRole}
          name={user.name}
          email={user.email}
          initials={user.initials}
          userId={user.id}
          salonName={salon?.name || "Salon"}
          isOpen={sidebarOpen}
          onNavigate={(page) => {
            router.push(`/${page}`);
            setSidebarOpen(false);
          }}
          onLogout={() => {
            tokenStorage.clearTokens();
            clearUnreadCountCache();
            dispatch(logout());
            router.replace("/login");
          }}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {!hideSidebar && user ? (
        <div className="lg:ml-60 flex flex-col min-h-screen transition-all duration-300">
          <BranchTopBar />
          {adminBlock.blocked && (
            <div className="bg-danger/5 border-b border-danger/20 px-6 py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-danger">Salon Deactivated by Admin</p>
                  <p className="text-[12px] text-danger/70 mt-0.5">
                    {adminBlock.reason || "Your salon has been deactivated by the platform administrator."}
                  </p>
                  <p className="text-[11px] text-danger/50 mt-1">
                    Customers cannot make new bookings while deactivated. Contact support if you believe this is an error.
                  </p>
                </div>
              </div>
            </div>
          )}
          {selectedBranch && selectedBranch.isActive === false && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3.5">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-amber-700">
                    Branch Inactive — {selectedBranch.name}
                  </p>
                  <p className="text-[12px] text-amber-600/90 mt-0.5">
                    {selectedBranch.deactivatedByAdmin
                      ? `This branch was deactivated by the platform admin. ${selectedBranch.adminDeactivationReason || "Online customer bookings for this branch are currently suspended."}`
                      : "This branch is currently deactivated. Customer bookings and online slots for this branch are suspended."}
                  </p>
                </div>
              </div>
            </div>
          )}
          <main className="flex-1 p-5 md:p-7 lg:p-8">
            {children}
          </main>
          <BranchSelectorModal />
          <NoBranchModal />
          <BookingNotificationToast />
        </div>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}
