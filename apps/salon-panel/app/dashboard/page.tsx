"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <ProtectedRoute page="dashboard">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="font-display text-3xl text-ink">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
          </h2>
          <p className="text-ash text-sm mt-1">
            Logged in as <span className="font-medium capitalize">{user?.role}</span>
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}