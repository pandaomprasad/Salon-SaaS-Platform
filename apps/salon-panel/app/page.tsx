// ============================================================
// app/page.tsx — Root redirect page
// Logged-in users -> /dashboard, unauthenticated -> /login
// ============================================================

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex items-center gap-2 text-muted">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Redirecting...</p>
      </div>
    </div>
  );
}