"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function CustomersPage() {
  return (
    <ProtectedRoute page="customers">
      <div className="space-y-6 animate-fade-in">
        <h2 className="font-display text-3xl text-ink">Customers</h2>
        <p className="text-ash text-sm">View and manage customer profiles.</p>
      </div>
    </ProtectedRoute>
  );
}