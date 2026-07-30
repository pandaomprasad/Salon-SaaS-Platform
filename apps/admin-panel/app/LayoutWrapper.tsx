"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { hydrateAuth, logout } from "@/store/slices/authSlice";
import { store } from "@/store";
import { tokenStorage } from "@/lib/api-client";
import Sidebar from "@/components/layout/Sidebar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = useState(false);

  const hideSidebar = pathname === "/login";

  useEffect(() => {
    setMounted(true);
    store.dispatch(hydrateAuth());
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [mounted, isLoading, isAuthenticated, pathname, router]);

  if (!mounted || isLoading) return null;
  if (!isAuthenticated && pathname !== "/login") return null;

  return (
    <div className="min-h-screen bg-subtle">
      {!hideSidebar && user && (
        <Sidebar
          currentPath={pathname}
          name={user.name}
          email={user.email}
          onNavigate={(path) => router.push(path)}
          onLogout={() => {
            dispatch(logout());
            router.replace("/login");
          }}
        />
      )}
      {!hideSidebar && user ? (
        <div className="lg:ml-56 min-h-screen">
          <main className="p-6 lg:p-8">{children}</main>
        </div>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}