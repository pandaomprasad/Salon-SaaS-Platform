"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function SchedulePage() {
  return (
    <ProtectedRoute page="schedule">
      <div className="space-y-6 animate-fade-in">
        <h2 className="font-display text-3xl text-ink">Staff Schedule</h2>
        <p className="text-ash text-sm">View and manage staff schedules and slots.</p>
      </div>
    </ProtectedRoute>
  );
}