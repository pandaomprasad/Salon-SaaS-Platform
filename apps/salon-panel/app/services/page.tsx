"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function ServicesPage() {
  return (
    <ProtectedRoute page="services">
      <div className="space-y-6 animate-fade-in">
        <h2 className="font-display text-3xl text-ink">Services & Pricing</h2>
        <p className="text-ash text-sm">Manage salon services and pricing.</p>
      </div>
    </ProtectedRoute>
  );
}