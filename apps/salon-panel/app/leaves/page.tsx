"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import LeaveFormModal from "@/components/leaves/LeaveFormModal";
import { approveLeave, rejectLeave } from "@/api/services/leaveService";
import apiClient from "@/lib/api-client";
import { parseApiError } from "@/lib/api-client";
import { useBranch } from "@/hooks/useBranch";
import {
  RefreshCw,
  Plus,
  AlertCircle,
  CalendarOff,
  Clock,
  X,
  Check,
  Info,
  CalendarCheck,
  CalendarDays,
  XCircle,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  UserCheck,
  Pencil,
} from "lucide-react";
import { getCached, setCache, invalidateCache } from "@/lib/cache";
import type { StaffLeave, Staff, LeaveType, LeaveStatus } from "@/lib/api";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTypeBadge(type: LeaveType) {
  const styles: Record<LeaveType, { bg: string; text: string; label: string }> = {
    SINGLE: { bg: "bg-blue-50 border-blue-200/80", text: "text-blue-700", label: "Single" },
    RANGE: { bg: "bg-purple-50 border-purple-200/80", text: "text-purple-700", label: "Range" },
    RECURRING: { bg: "bg-amber-50 border-amber-200/80", text: "text-amber-700", label: "Recurring" },
  };
  const s = styles[type] || styles.SINGLE;
  return (
    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

const STATUS_BADGES: Record<
  "ACTIVE" | LeaveStatus,
  { label: string; bg: string; text: string }
> = {
  PENDING: { label: "Pending", bg: "bg-amber-50 border-amber-200/80", text: "text-amber-700" },
  APPROVED: { label: "Approved", bg: "bg-emerald-50 border-emerald-200/80", text: "text-emerald-700" },
  REJECTED: { label: "Rejected", bg: "bg-rose-50 border-rose-200/80", text: "text-rose-600" },
  ACTIVE: { label: "Active", bg: "bg-emerald-50 border-emerald-200/80", text: "text-emerald-700" },
};

function getStatusBadge(leave: StaffLeave) {
  const key = leave.isActive ? leave.status : "ACTIVE";
  const b = STATUS_BADGES[key] || STATUS_BADGES.ACTIVE;
  return (
    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${b.bg} ${b.text}`}>
      {b.label}
    </span>
  );
}

function coverageText(leave: StaffLeave): string {
  if (leave.type === "SINGLE") return formatDate(leave.date);
  return `${formatDate(leave.startDate)} → ${formatDate(leave.endDate)}`;
}

function windowText(leave: StaffLeave): string {
  if (leave.allDay) return "All day";
  return `${leave.startTime} – ${leave.endTime}`;
}

export default function LeavesPage() {
  const { branchId, canManage } = useBranch();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includePast, setIncludePast] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Date Month Selector State
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffLeave | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const selfMode = !canManage;

  // Load staff list (managers/owners)
  useEffect(() => {
    if (!canManage) return;
    if (!branchId) return;

    const cacheKey = `staff_${branchId}`;
    const cached = getCached<Staff[]>(cacheKey);
    if (cached) {
      setStaffList(cached);
      return;
    }
    apiClient
      .get(`/branches/${branchId}/staff`)
      .then(({ data }) => {
        const list = data.data?.staff || [];
        setStaffList(list);
        setCache(cacheKey, list);
      })
      .catch(() => {});
  }, [branchId, canManage]);

  // Auto-select first staff member
  useEffect(() => {
    if (canManage && staffList.length > 0 && !selectedStaffId) {
      setSelectedStaffId(staffList[0]._id);
    }
  }, [staffList, selectedStaffId, canManage]);

  const fetchLeaves = useCallback(async () => {
    if (!branchId && !selfMode) return;
    if (canManage && !selectedStaffId) return;

    const cacheKey = `leaves_${branchId}_${selfMode ? "me" : selectedStaffId}_${includePast}`;
    const cached = getCached<StaffLeave[]>(cacheKey);
    if (cached) {
      setLeaves(cached);
      setLoading(false);
    }

    setLoading(true);
    setError(null);
    try {
      let list: StaffLeave[];
      if (selfMode) {
        const { data } = await apiClient.get(`/staff/me/leaves`, {
          params: { includePast: includePast || undefined },
        });
        list = data.data?.leaves || [];
      } else {
        const { data } = await apiClient.get(
          `/branches/${branchId}/staff/${selectedStaffId}/leaves`,
          { params: { includePast: includePast || undefined } },
        );
        list = data.data?.leaves || [];
      }
      setLeaves(list);
      setCache(cacheKey, list);
    } catch {
      setError("Failed to load leaves");
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedStaffId, selfMode, includePast, canManage]);

  useEffect(() => {
    setLeaves([]);
    fetchLeaves();
  }, [fetchLeaves]);

  async function handleCancel(leaveId: string) {
    if (!confirm("Cancel this leave? Available slots will be restored.")) return;
    setCancellingId(leaveId);
    try {
      if (selfMode) {
        await apiClient.delete(`/staff/me/leaves/${leaveId}`);
      } else {
        await apiClient.delete(
          `/branches/${branchId}/staff/${selectedStaffId}/leaves/${leaveId}`,
        );
      }
      invalidateCache("leaves_");
      setLeaves((prev) =>
        prev.map((l) => (l._id === leaveId ? { ...l, isActive: false } : l)),
      );
    } catch (err: unknown) {
      alert(parseApiError(err).message);
    } finally {
      setCancellingId(null);
    }
  }

  async function handleApprove(leave: StaffLeave) {
    if (!confirm("Approve this leave request? Slots will be blocked immediately.")) return;
    setReviewingId(leave._id);
    try {
      await approveLeave(branchId, leave.staffId, leave._id);
      invalidateCache("leaves_");
      setLeaves((prev) =>
        prev.map((l) => (l._id === leave._id ? { ...l, status: "APPROVED" } : l)),
      );
    } catch (err: unknown) {
      alert(parseApiError(err).message);
    } finally {
      setReviewingId(null);
    }
  }

  async function handleReject(leave: StaffLeave) {
    const reason = window.prompt("Reason for rejection (optional):") ?? "";
    setReviewingId(leave._id);
    try {
      await rejectLeave(branchId, leave.staffId, leave._id, reason || undefined);
      invalidateCache("leaves_");
      setLeaves((prev) =>
        prev.map((l) =>
          l._id === leave._id
            ? { ...l, status: "REJECTED", rejectionReason: reason || null }
            : l,
        ),
      );
    } catch (err: unknown) {
      alert(parseApiError(err).message);
    } finally {
      setReviewingId(null);
    }
  }

  // Month navigation helpers
  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  // Calculate Metrics
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingCount = leaves.filter(
    (l) => l.isActive && l.status !== "REJECTED" && (l.date ? l.date >= todayStr : (l.endDate || "") >= todayStr)
  ).length;

  const totalLeaveDaysCount = leaves.filter((l) => l.isActive && l.status !== "REJECTED").length;

  const cancelledCount = leaves.filter((l) => !l.isActive || l.status === "REJECTED").length;

  const pastCount = leaves.filter(
    (l) => l.isActive && (l.date ? l.date < todayStr : (l.endDate || "") < todayStr)
  ).length;

  const selectedStaffObj = staffList.find((s) => s._id === selectedStaffId);

  return (
    <ProtectedRoute page="leaves">
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Leaves & Availability</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              {selfMode
                ? "Request and manage your own leaves"
                : "Manage staff leave days and time windows"}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={fetchLeaves}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 rounded-2xl transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                setEditing(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-[#5542f6] hover:bg-[#4332e0] text-white rounded-2xl transition-all shadow-xs"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>{selfMode ? "Request Leave" : "Add Leave"}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Staff Selector */}
            {canManage && (
              <div className="relative min-w-[240px]">
                <UserCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-8 py-2.5 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:border-[#5542f6] shadow-2xs cursor-pointer"
                >
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.role?.name || "staff"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Month Navigation Picker */}
            <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-2xl px-3 py-1.5 shadow-2xs">
              <CalendarDays size={15} className="text-slate-400 shrink-0" />
              <span className="text-xs font-extrabold text-slate-800 min-w-[120px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Show cancelled / past leaves checkbox */}
          <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includePast}
              onChange={(e) => setIncludePast(e.target.checked)}
              className="w-4 h-4 rounded-md text-[#5542f6] focus:ring-[#5542f6] border-slate-300 accent-[#5542f6] cursor-pointer"
            />
            <span>Show cancelled / past leaves</span>
          </label>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Upcoming Leaves */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CalendarCheck size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{upcomingCount}</p>
              <p className="text-xs font-bold text-slate-500 mt-0.5">Upcoming Leaves</p>
            </div>
          </div>

          {/* Card 2: Total Leave Days */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{totalLeaveDaysCount}</p>
              <p className="text-xs font-bold text-slate-500 mt-0.5">Total Leave Days</p>
            </div>
          </div>

          {/* Card 3: Cancelled Leaves */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
              <XCircle size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{cancelledCount}</p>
              <p className="text-xs font-bold text-slate-500 mt-0.5">Cancelled Leaves</p>
            </div>
          </div>

          {/* Card 4: Past Leaves */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <CalendarDays size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{pastCount}</p>
              <p className="text-xs font-bold text-slate-500 mt-0.5">Past Leaves</p>
            </div>
          </div>

        </div>

        {/* Info Alert for Self-Mode */}
        {selfMode && (
          <div className="flex items-center gap-3 text-xs font-medium text-slate-700 bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4">
            <Info size={16} className="text-blue-600 shrink-0" />
            <p>
              Your leave requests are sent to the manager for approval and take effect only once approved.
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 text-rose-600 bg-rose-50 border border-rose-200/80 rounded-2xl px-4 py-3 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <p className="flex-1">{error}</p>
            <button onClick={fetchLeaves} className="underline font-bold hover:text-rose-800">
              Retry
            </button>
          </div>
        )}

        {/* Main Card: Leave Records */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          
          {/* Card Top Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CalendarDays size={18} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Leave Records</h3>
                <p className="text-[11px] font-medium text-slate-500">
                  {canManage && selectedStaffObj
                    ? `Showing leave records for ${selectedStaffObj.name}`
                    : "Showing your leave records"}
                </p>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 self-start sm:self-auto">
              <button
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutList size={14} />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  viewMode === "calendar"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CalendarDays size={14} />
                <span>Calendar</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : canManage && !selectedStaffId ? (
            <div className="text-center py-16 px-4">
              <p className="text-xs font-bold text-slate-500">Select a staff member to view their leaves.</p>
            </div>
          ) : leaves.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <CalendarDays size={26} strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No leaves found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                This staff member has no leave records yet.
              </p>
              <button
                onClick={() => {
                  setEditing(null);
                  setShowModal(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-[#5542f6] hover:bg-[#4332e0] text-white rounded-2xl transition-all shadow-xs"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add Leave</span>
              </button>
            </div>
          ) : viewMode === "list" ? (
            /* Table List View */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80">
                    <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 w-12 text-center">#</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Leave Type</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Duration</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Reason</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.map((leave, index) => (
                    <tr
                      key={leave._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        leave.isActive ? "" : "opacity-60 bg-slate-50/50"
                      }`}
                    >
                      <td className="py-4 px-4 text-xs font-bold text-slate-400 text-center">
                        {index + 1}
                      </td>

                      <td className="py-4 px-5 text-xs font-extrabold text-slate-900">
                        <div>{coverageText(leave)}</div>
                        {leave.type === "RECURRING" && (
                          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                            {leave.weekdays?.map((w) => WEEKDAY_LABELS[w]).join(", ")}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {getTypeBadge(leave.type)}
                      </td>

                      <td className="py-4 px-5 text-xs font-medium text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          {windowText(leave)}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-xs font-medium text-slate-600 max-w-xs truncate">
                        {leave.reason || "—"}
                      </td>

                      <td className="py-4 px-5 text-xs">
                        {getStatusBadge(leave)}
                        {leave.status === "REJECTED" && leave.rejectionReason && (
                          <p className="text-[11px] font-medium text-slate-400 mt-1 max-w-44 truncate">
                            {leave.rejectionReason}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        {leave.isActive && (
                          <div className="flex items-center justify-end gap-1.5">
                            {canManage && leave.status === "PENDING" && (
                              <>
                                <button
                                  disabled={reviewingId === leave._id}
                                  onClick={() => handleApprove(leave)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all shadow-xs disabled:opacity-50"
                                >
                                  <Check size={13} strokeWidth={2.5} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  disabled={reviewingId === leave._id}
                                  onClick={() => handleReject(leave)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all shadow-xs disabled:opacity-50"
                                >
                                  <X size={13} strokeWidth={2.5} />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {canManage && leave.status !== "PENDING" && (
                              <button
                                onClick={() => {
                                  setEditing(leave);
                                  setShowModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all shadow-xs"
                              >
                                <Pencil size={13} />
                                <span>Edit</span>
                              </button>
                            )}

                            {!canManage && (leave.status === "PENDING" || leave.status === "APPROVED") && (
                              <button
                                disabled={cancellingId === leave._id}
                                onClick={() => handleCancel(leave._id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all shadow-xs disabled:opacity-50"
                              >
                                <X size={13} strokeWidth={2.5} />
                                <span>{leave.status === "PENDING" ? "Withdraw" : "Cancel"}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Calendar View */
            <div className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                {WEEKDAY_LABELS.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, idx) => {
                  const dayNum = idx - 2; // sample month grid calculation
                  const isValid = dayNum > 0 && dayNum <= 30;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const leaveOnDay = leaves.find(
                    (l) =>
                      l.date === dateStr ||
                      Boolean(l.startDate && l.endDate && l.startDate <= dateStr && dateStr <= l.endDate)
                  );

                  return (
                    <div
                      key={idx}
                      className={`min-h-[70px] rounded-2xl p-2 border flex flex-col justify-between text-xs font-bold transition-all ${
                        !isValid
                          ? "bg-slate-50/40 border-transparent text-slate-300 pointer-events-none"
                          : leaveOnDay
                          ? "bg-rose-50/70 border-rose-200/80 text-rose-800"
                          : "bg-white border-slate-200/70 text-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <span>{isValid ? dayNum : ""}</span>
                      {leaveOnDay && (
                        <span className="text-[10px] font-extrabold bg-rose-200/80 text-rose-900 px-1.5 py-0.5 rounded-md truncate">
                          On Leave
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <LeaveFormModal
            branchId={branchId}
            staffList={staffList}
            defaultStaffId={selectedStaffId || staffList[0]?._id}
            selfMode={selfMode}
            editing={editing}
            onSuccess={() => {
              setShowModal(false);
              setEditing(null);
              invalidateCache("leaves_");
              fetchLeaves();
            }}
            onClose={() => {
              setShowModal(false);
              setEditing(null);
            }}
          />
        )}

      </div>
    </ProtectedRoute>
  );
}
