"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function BranchesPage() {
  return (
    <ProtectedRoute page="branches">
      <div className="space-y-6 animate-fade-in">
        <h2 className="font-display text-3xl text-ink">Branches</h2>
        <p className="text-ash text-sm">Manage your salon branches.</p>
      </div>
    </ProtectedRoute>
  );
}