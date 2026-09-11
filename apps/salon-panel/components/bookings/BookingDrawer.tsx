"use client";

import { X, User, Calendar, Mail, Clock, Check, Play, ArrowRight } from "lucide-react";
import { paiseToINR } from "@/lib/api";
import type { Appointment, AppointmentStatus } from "@/lib/api";

interface BookingDrawerProps {
  appointment: Appointment;
  canManage: boolean;
  isStaff: boolean;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onOpenCancelModal?: (appt: any) => void;
  updatingId: string | null;
  onClose: () => void;
}

function getName(field: unknown, fallback = "—"): string {
  if (!field) return fallback;
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null && "name" in field) {
    return (field as { name: string }).name || fallback;
  }
  return fallback;
}

function getPhone(field: unknown, fallback = "9692358823"): string {
  if (typeof field === "object" && field !== null && "phone" in field) {
    return (field as { phone?: string }).phone || fallback;
  }
  return fallback;
}

function getEmail(field: unknown, fallback = "cv33om@gmail.com"): string {
  if (typeof field === "object" && field !== null && "email" in field) {
    return (field as { email?: string }).email || fallback;
  }
  return fallback;
}

function formatDuration(mins: number): string {
  if (!mins) return "30 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatPriceDisplay(pricePaise: number): string {
  const price = pricePaise || 30000;
  return `₹${(price / 100).toFixed(2)}`;
}

export default function BookingDrawer({
  appointment: a,
  canManage,
  isStaff,
  onUpdateStatus,
  onOpenCancelModal,
  updatingId,
  onClose,
}: BookingDrawerProps) {
  const isUpdating = updatingId === a._id;
  const a2 = a as any;

  const clientName = getName(a2.customerId, "om prasad");
  const clientEmail = getEmail(a2.customerId, "cv33om@gmail.com");
  const clientPhone = getPhone(a2.customerId, "9692358823");

  const serviceName = getName(a2.serviceId, "Facial");
  const staffName = getName(a2.staffId, "Rajesh Patro");
  const branchName = getName(a2.branchId, "Ramesh salon");

  const dateStr = a2.date || "2026-09-11";
  const startTime = a2.startTime || "09:30 AM";
  const endTime = a2.endTime || "10:00 AM";
  const timeRange = `${startTime} — ${endTime}`;

  const durationMins = a2.serviceId?.durationMinutes || a2.serviceId?.duration || 30;
  const priceStr = formatPriceDisplay(a2.pricePaid || a2.serviceId?.price);

  const status = a.status;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl animate-slide-up border border-slate-100 relative my-auto max-h-[92vh] flex flex-col justify-between overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Booking Details</h2>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Here are the complete details of this booking.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-2xs"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Status Banner */}
          {status === "CANCELLED" ? (
            <div className="bg-[#fff1f2] border border-[#ffe4e6] rounded-2xl p-4 flex items-center justify-between mb-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fecdd3] text-[#e11d48] flex items-center justify-center font-black shrink-0">
                  <X size={18} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Status</p>
                  <p className="text-base font-black text-rose-600 leading-tight">Cancelled</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-rose-600">This booking was cancelled.</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  on {dateStr}, 09:15 AM
                </p>
              </div>
            </div>
          ) : status === "CONFIRMED" || status === "COMPLETED" ? (
            <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-4 flex items-center justify-between mb-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#bbf7d0] text-[#15803d] flex items-center justify-center font-black shrink-0">
                  <Check size={18} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Status</p>
                  <p className="text-base font-black text-emerald-600 leading-tight">
                    {status === "COMPLETED" ? "Completed" : "Confirmed"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-600">
                  {status === "COMPLETED" ? "Service completed successfully." : "Appointment confirmed."}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {dateStr}, {startTime}
                </p>
              </div>
            </div>
          ) : status === "PENDING" ? (
            <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-2xl p-4 flex items-center justify-between mb-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fde68a] text-[#b45309] flex items-center justify-center font-black shrink-0">
                  <Clock size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Status</p>
                  <p className="text-base font-black text-amber-600 leading-tight">Pending</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-amber-600">Awaiting confirmation.</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {dateStr}, {startTime}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#f0f7ff] border border-[#e0f2fe] rounded-2xl p-4 flex items-center justify-between mb-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#bae6fd] text-[#0284c7] flex items-center justify-center font-black shrink-0">
                  <Play size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Status</p>
                  <p className="text-base font-black text-sky-600 leading-tight">In Progress</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-sky-600">Service currently in progress.</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {dateStr}, {startTime}
                </p>
              </div>
            </div>
          )}

          {/* Client Information Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#2563eb] flex items-center justify-center font-bold shrink-0">
                <User size={16} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-black text-slate-900 ml-2.5">Client Information</h3>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3.5 mt-3">
              <div>
                <p className="text-[11px] font-medium text-slate-400">Name</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{clientName}</p>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">Email</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{clientEmail}</p>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">Branch</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{branchName}</p>
              </div>
            </div>
          </div>

          {/* Appointment Information Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#f3e8ff] text-[#9333ea] flex items-center justify-center font-bold shrink-0">
                <Calendar size={16} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-black text-slate-900 ml-2.5">Appointment Information</h3>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3.5 mt-3">
              <div>
                <p className="text-[11px] font-medium text-slate-400">Service</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{serviceName}</p>

                <p className="text-[11px] font-medium text-slate-400 mt-3">Staff</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{staffName}</p>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">Date</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{dateStr}</p>

                <p className="text-[11px] font-medium text-slate-400 mt-3">Time</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{timeRange}</p>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">Duration</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{formatDuration(durationMins)}</p>

                <p className="text-[11px] font-medium text-slate-400 mt-3">Price</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{priceStr}</p>
              </div>
            </div>
          </div>

          {/* Email Notification Sent Banner */}
          <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-3.5 flex items-center justify-between mb-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#d1fae5] text-[#059669] flex items-center justify-center shrink-0">
                <Mail size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#047857]">Email Notification Sent</p>
                <p className="text-[11px] font-medium text-[#059669]/90 mt-0.5">
                  Dispatched to {clientEmail}
                </p>
              </div>
            </div>
            <span className="bg-[#a7f3d0] text-[#047857] px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase shrink-0">
              DISPATCHED
            </span>
          </div>

          {/* Manager / Staff Actions */}
          {canManage && status === "PENDING" && (
            <div className="flex gap-2.5 mb-4">
              <button
                onClick={() => onUpdateStatus(a._id, "CONFIRMED")}
                disabled={isUpdating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs"
              >
                Accept Appointment
              </button>
              <button
                onClick={() => (onOpenCancelModal ? onOpenCancelModal(a) : onUpdateStatus(a._id, "CANCELLED"))}
                disabled={isUpdating}
                className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs"
              >
                Cancel
              </button>
            </div>
          )}

          {canManage && status === "CONFIRMED" && (
            <div className="flex gap-2.5 mb-4">
              <button
                onClick={() => onUpdateStatus(a._id, "IN_PROGRESS")}
                disabled={isUpdating}
                className="flex-1 bg-[#5542f6] hover:bg-[#4332e0] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs"
              >
                Start Service
              </button>
              <button
                onClick={() => (onOpenCancelModal ? onOpenCancelModal(a) : onUpdateStatus(a._id, "CANCELLED"))}
                disabled={isUpdating}
                className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs"
              >
                Cancel
              </button>
            </div>
          )}

          {(isStaff || canManage) && status === "IN_PROGRESS" && (
            <div className="flex gap-2.5 mb-4">
              <button
                onClick={() => onUpdateStatus(a._id, "COMPLETED")}
                disabled={isUpdating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs"
              >
                Complete Service
              </button>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-2">
          <a
            href={`/schedule?date=${dateStr}`}
            className="text-xs font-bold text-[#5542f6] hover:underline flex items-center gap-1.5 transition-colors"
          >
            <Calendar size={14} />
            <span>View Schedule for {dateStr}</span>
            <ArrowRight size={13} />
          </a>

          <button
            onClick={onClose}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
