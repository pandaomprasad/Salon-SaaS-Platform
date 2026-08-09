"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
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
} from "lucide-react";
import { getCached, setCache, invalidateCache } from "@/lib/cache";
import type { StaffLeave, Staff, LeaveType, LeaveStatus } from "@/lib/api";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTypeBadge(type: LeaveType) {
  const styles: Record<LeaveType, string> = {
    SINGLE: "bg-accent/10 text-accent",
    RANGE: "bg-blue-50 text-blue-600",
    RECURRING: "bg-warning/10 text-warning",
  };
  return (
    <span
      className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${styles[type]}`}
    >
      {type === "SINGLE" ? "Single" : type === "RANGE" ? "Range" : "Recurring"}
    </span>
  );
}

const STATUS_BADGES: Record<
  "ACTIVE" | LeaveStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "bg-warning/10 text-warning" },
  APPROVED: { label: "Approved", className: "bg-success/10 text-success" },
  REJECTED: { label: "Rejected", className: "bg-danger/10 text-danger" },
  ACTIVE: { label: "Active", className: "bg-success/10 text-success" },
};

function getStatusBadge(leave: StaffLeave) {
  const key = leave.isActive
    ? leave.status
    : "ACTIVE"; // cancelled overrides
  const b = STATUS_BADGES[key] || STATUS_BADGES.ACTIVE;
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${b.className}`}>
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
  return `${leave.startTime}–${leave.endTime}`;
}

export default function LeavesPage() {
  const { branchId, canManage } = useBranch();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includePast, setIncludePast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffLeave | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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

  const [reviewingId, setReviewingId] = useState<string | null>(null);

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

  return (
    <ProtectedRoute page="leaves">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Leaves &amp; Availability</h2>
            <p className="text-[13px] text-muted mt-1">
              {selfMode
                ? "Request and manage your own leaves"
                : "Manage staff leave days and time windows"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={fetchLeaves}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => {
                setEditing(null);
                setShowModal(true);
              }}
            >
              {selfMode ? "Request Leave" : "Add Leave"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canManage && (
            <div className="w-72">
              <Select
                value={selectedStaffId}                onChange={(e) => {
                  setSelectedStaffId(e.target.value);
                }}
                options={[
                  { value: "", label: "Select staff member…" },
                  ...staffList.map((s) => ({
                    value: s._id,
                    label: `${s.name} (${s.role.name})`,
                  })),
                ]}
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-[13px] text-slate cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includePast}
              onChange={(e) => setIncludePast(e.target.checked)}
              className="accent-accent"
            />
            Show cancelled / past
          </label>
        </div>

        {selfMode && (
          <div className="flex items-center gap-2.5 text-[13px] text-slate bg-accent/5 border border-accent/15 rounded-lg px-4 py-3">
            <Info size={14} className="text-accent shrink-0" />
            <p>
              Your leave requests are sent to the manager for approval and take
              effect only once approved.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-danger bg-danger/5 rounded-lg px-4 py-3">
            <AlertCircle size={14} />
            <p className="text-[13px]">{error}</p>
            <Button size="sm" variant="ghost" onClick={fetchLeaves}>
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-border/50 rounded h-10 w-full"
                />
              ))}
            </div>
          </div>
        ) : canManage && !selectedStaffId ? (
          <div className="text-center text-muted py-12 text-[13px]">
            Select a staff member to view their leaves.
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center text-muted py-12 text-[13px]">
            No leaves found.
          </div>
        ) : (
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-subtle/60">
                    <th className="text-left text-xs font-medium text-slate px-5 py-3">
                      Type
                    </th>
                    <th className="text-left text-xs font-medium text-slate px-5 py-3">
                      Coverage
                    </th>
                    <th className="text-left text-xs font-medium text-slate px-5 py-3">
                      Window
                    </th>
                    {selfMode ? null : (
                      <th className="text-left text-xs font-medium text-slate px-5 py-3">
                        Staff
                      </th>
                    )}
                    <th className="text-left text-xs font-medium text-slate px-5 py-3">
                      Reason
                    </th>
                    <th className="text-left text-xs font-medium text-slate px-5 py-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-medium text-slate px-5 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr
                      key={leave._id}
                      className={`border-b border-border/60 hover:bg-subtle/40 transition-colors ${
                        leave.isActive ? "" : "opacity-60"
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        {getTypeBadge(leave.type)}
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-ink">
                        <div className="font-medium">
                          {coverageText(leave)}
                        </div>
                        {leave.type === "RECURRING" && (
                          <div className="text-[11px] text-muted mt-0.5">
                            {leave.weekdays
                              ?.map((w) => WEEKDAY_LABELS[w])
                              .join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-slate">
                          <Clock size={11} />
                          {windowText(leave)}
                        </span>
                      </td>
                      {selfMode ? null : (
                        <td className="px-5 py-3.5 text-[13px] text-slate">
                          {staffList.find((s) => s._id === leave.staffId)?.name ||
                            "—"}
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-[13px] text-slate max-w-52 truncate">
                        {leave.reason || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(leave)}
                        {leave.status === "REJECTED" && leave.rejectionReason && (
                          <div className="text-[11px] text-muted mt-1 max-w-44">
                            {leave.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {leave.isActive && (
                          <div className="flex justify-end gap-1.5">
                            {canManage && leave.status === "PENDING" && (
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  icon={<Check size={12} />}
                                  loading={reviewingId === leave._id}
                                  onClick={() => handleApprove(leave)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  icon={<X size={12} />}
                                  loading={reviewingId === leave._id}
                                  onClick={() => handleReject(leave)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                            {canManage && leave.status !== "PENDING" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={<CalendarOff size={12} />}
                                onClick={() => {
                                  setEditing(leave);
                                  setShowModal(true);
                                }}
                              >
                                Edit
                              </Button>
                            )}
                            {!canManage && leave.status === "PENDING" && (
                              <Button
                                size="sm"
                                variant="danger"
                                icon={<X size={12} />}
                                loading={cancellingId === leave._id}
                                onClick={() => handleCancel(leave._id)}
                              >
                                Withdraw
                              </Button>
                            )}
                            {!canManage && leave.status === "APPROVED" && (
                              <Button
                                size="sm"
                                variant="danger"
                                icon={<X size={12} />}
                                loading={cancellingId === leave._id}
                                onClick={() => handleCancel(leave._id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
