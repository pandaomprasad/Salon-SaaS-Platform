"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function NotificationsPage() {
  return (
    <ProtectedRoute page="notifications">
      <div className="space-y-6 animate-fade-in">
        <h2 className="font-display text-3xl text-ink">Notifications</h2>
        <p className="text-ash text-sm">Your recent alerts and updates.</p>
      </div>
    </ProtectedRoute>
  );
}