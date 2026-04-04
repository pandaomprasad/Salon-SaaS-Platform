"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  getAppointments,
  updateAppointmentStatus,
} from "@/api/services/appointmentService";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import BookingDrawer from "@/components/bookings/BookingDrawer";
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { paiseToINR } from "@/lib/api";
import type { Appointment, AppointmentStatus, UserRole } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
];

function getName(field: unknown, fallback = "—"): string {
  if (!field) return fallback;
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null && "name" in field) {
    return (field as { name: string }).name;
  }
  return fallback;
}

function formatDuration(mins: number): string {
  if (!mins) return "—";
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getDurationMins(a: any): number {
  return a.serviceId?.durationMinutes || a.serviceId?.duration || 0;
}

function getPrice(a: any): string {
  const price = a.pricePaid || a.serviceId?.price || 0;
  return `₹${price.toLocaleString("en-IN")}`;
}


export default function BookingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const role = (user?.role || "staff") as UserRole;
  const canManage = role === "owner" || role === "manager";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: string; limit?: number } = { limit: 100 };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const res = await getAppointments(params);
      const resData = res.data as any;
      const list = Array.isArray(resData) ? resData : resData?.appointments || [];
      setAppointments(list);
      setAppointments(list);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load bookings";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const filtered = appointments.filter((a: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      getName(a.customerId).toLowerCase().includes(q) ||
      getName(a.serviceId).toLowerCase().includes(q) ||
      getName(a.staffId).toLowerCase().includes(q)
    );
  });

  async function handleUpdateStatus(id: string, status: AppointmentStatus) {
    setUpdatingId(id);
    try {
      const res = await updateAppointmentStatus(id, { status });
      setAppointments((prev) =>
        prev.map((a: any) => (a._id === id ? { ...a, status } : a)),
      );
      setSelected((prev: any) =>
        prev?._id === id ? { ...prev, status } : prev,
      );
      setSelected((prev) =>
        prev?._id === id ? { ...prev, ...res.data } : prev,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      alert(message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <ProtectedRoute page="bookings">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display">Bookings</h2>
            <p className="text-sm text-ash mt-1">
              {loading ? "Loading..." : `${filtered.length} bookings found`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={13} />}
            onClick={fetchAppointments}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-60">
            <Input
              placeholder="Search by client, service, staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
          <div className="w-44">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-4 py-3">
            <AlertCircle size={14} />
            <p className="text-sm">{error}</p>
            <Button size="sm" variant="ghost" onClick={fetchAppointments}>
              Retry
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-smoke rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-smoke bg-smoke/40">
                  {["Client", "Service", "Staff", "Date", "Time", "Duration", "Price", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-ash px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center text-ash py-12 text-sm">
                      Loading bookings...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-ash py-12 text-sm">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a: any) => (
                    <tr
                      key={a._id}
                      onClick={() => setSelected(a)}
                      className="border-b border-smoke/50 hover:bg-smoke/20 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 font-medium">{getName(a.customerId)}</td>
                      <td className="px-5 py-3.5 text-ash">{getName(a.serviceId)}</td>
                      <td className="px-5 py-3.5 text-ash">{getName(a.staffId)}</td>
                      <td className="px-5 py-3.5 text-ash">{a.date || "—"}</td>
                      <td className="px-5 py-3.5 text-ash">{a.startTime || "—"}</td>
                      <td className="px-5 py-3.5 text-ash">{formatDuration(getDurationMins(a))}</td>
                      <td className="px-5 py-3.5 font-medium">{getPrice(a)}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        {canManage && a.status === "PENDING" && (
                          <div className="flex gap-1.5">
                            <Button size="sm" onClick={() => handleUpdateStatus(a._id, "CONFIRMED")} loading={updatingId === a._id}>
                              Confirm
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(a._id, "CANCELLED")} loading={updatingId === a._id}>
                              Cancel
                            </Button>
                          </div>
                        )}
                        {canManage && a.status === "CONFIRMED" && (
                          <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(a._id, "IN_PROGRESS")} loading={updatingId === a._id}>
                            Start
                          </Button>
                        )}
                        {(role === "staff" || canManage) && a.status === "IN_PROGRESS" && (
                          <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(a._id, "COMPLETED")} loading={updatingId === a._id}>
                            Complete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Booking detail drawer */}
        {selected && (
          <BookingDrawer
            appointment={selected}
            canManage={canManage}
            isStaff={role === "staff"}
            onUpdateStatus={handleUpdateStatus}
            updatingId={updatingId}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}