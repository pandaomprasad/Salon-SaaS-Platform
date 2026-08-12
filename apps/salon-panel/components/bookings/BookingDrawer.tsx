"use client";

import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { X } from "lucide-react";
import { paiseToINR } from "@/lib/api";
import type { Appointment, AppointmentStatus } from "@/lib/api";

interface BookingDrawerProps {
  appointment: Appointment;
  canManage: boolean;
  isStaff: boolean;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  updatingId: string | null;
  onClose: () => void;
}

function getField(field: unknown, key: string, fallback = "—"): string {
  if (!field) return fallback;
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null && key in field) {
    return String((field as Record<string, unknown>)[key]);
  }
  return fallback;
}

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

export default function BookingDrawer({
  appointment: a,
  canManage,
  isStaff,
  onUpdateStatus,
  updatingId,
  onClose,
}: BookingDrawerProps) {
  const isUpdating = updatingId === a._id;

  const a2 = a as any;
  const details = [
    ["Client", getName(a2.customerId)],
    ["Email", a2.customerId?.email || "—"],
    ["Phone", a2.customerId?.phone || "—"],
    ["Service", getName(a2.serviceId)],
    ["Staff", getName(a2.staffId)],
    ["Branch", getName(a2.branchId)],
    ["Date", a2.date || "—"],
    ["Time", `${a2.startTime || "—"} — ${a2.endTime || "—"}`],
    ["Duration", formatDuration(a2.serviceId?.durationMinutes || 0)],
    ["Price", paiseToINR(a2.pricePaid || 0)],
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-end p-6"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">Booking Detail</h3>
          <button
            onClick={onClose}
            className="text-ash hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm">
          {details.map(([key, val]) => (
            <div key={key} className="flex justify-between">
              <span className="text-ash">{key}</span>
              <span className="font-medium">{val}</span>
            </div>
          ))}
          <div className="flex justify-between items-center">
            <span className="text-ash">Status</span>
            <StatusBadge status={a.status} />
          </div>
        </div>

        {/* Notes */}
        {a.customerNotes && (
          <div className="mt-4 bg-smoke rounded-xl p-3">
            <p className="text-xs text-ash mb-1">Customer Notes</p>
            <p className="text-sm">{a.customerNotes}</p>
          </div>
        )}

        {/* Email Notification Status */}
        {(a2.emailSent || (a2.emailLogs && a2.emailLogs.length > 0) || a.status === "PENDING" || a.status === "CONFIRMED" || a.status === "COMPLETED") && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                📧
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700">Email Notification Sent</p>
                <p className="text-[11px] text-emerald-600/90 mt-0.5">
                  {a2.customerId?.email ? `Dispatched to ${a2.customerId.email}` : "Customer notified via email"}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 uppercase tracking-wider shrink-0">
              {a.status === "PENDING" ? "Booking Recvd" : a.status === "CONFIRMED" ? "Accepted Mail" : a.status === "COMPLETED" ? "Thank You Mail" : "Dispatched"}
            </span>
          </div>
        )}

        {/* Rating */}
        {a2.rating?.score && (
          <div className="mt-3 bg-smoke rounded-xl p-3">
            <p className="text-xs text-ash mb-1">Rating</p>
            <p className="text-sm font-medium">
              {"★".repeat(a2.rating.score)}{"☆".repeat(5 - a2.rating.score)}
              {a2.rating.review && (
                <span className="text-ash font-normal ml-2">— {a2.rating.review}</span>
              )}
            </p>
          </div>
        )}

        {/* Actions based on current status + role */}
        <div className="mt-6 pt-5 border-t border-smoke flex gap-2">
          {canManage && a.status === "PENDING" && (
            <>
              <Button className="flex-1" onClick={() => onUpdateStatus(a._id, "CONFIRMED")} loading={isUpdating}>
                Accept Appointment
              </Button>
              <Button className="flex-1" variant="danger" onClick={() => onUpdateStatus(a._id, "CANCELLED")} loading={isUpdating}>
                Cancel
              </Button>
            </>
          )}
          {canManage && a.status === "CONFIRMED" && (
            <>
              <Button className="flex-1" onClick={() => onUpdateStatus(a._id, "IN_PROGRESS")} loading={isUpdating}>
                Start Service
              </Button>
              <Button className="flex-1" variant="danger" onClick={() => onUpdateStatus(a._id, "CANCELLED")} loading={isUpdating}>
                Cancel
              </Button>
            </>
          )}
          {(isStaff || canManage) && a.status === "IN_PROGRESS" && (
            <>
              <Button className="flex-1" onClick={() => onUpdateStatus(a._id, "COMPLETED")} loading={isUpdating}>
                Complete
              </Button>
              {/* <Button className="flex-1" variant="secondary" onClick={() => onUpdateStatus(a._id, "NO_SHOW")} loading={isUpdating}>
                No Show
              </Button> */}
            </>
          )}
          {a.status === "COMPLETED" && (
            <p className="text-xs text-ash text-center w-full">This booking is complete.</p>
          )}
          {a.status === "CANCELLED" && (
            <p className="text-xs text-red-400 text-center w-full">This booking was cancelled.</p>
          )}
        </div>

        {a2.date && (
          <div className="mt-3 pt-3 border-t border-smoke text-center">
            <a
              href={`/schedule?date=${a2.date}`}
              className="text-xs font-semibold text-gold hover:underline inline-flex items-center gap-1"
            >
              📅 View Schedule for {a2.date} →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
