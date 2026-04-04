"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function ReportsPage() {
  return (
    <ProtectedRoute page="reports">
      <div className="space-y-6 animate-fade-in">
        <h2 className="font-display text-3xl text-ink">Reports & Analytics</h2>
        <p className="text-ash text-sm">Revenue, performance, and booking analytics.</p>
      </div>
    </ProtectedRoute>
  );
}