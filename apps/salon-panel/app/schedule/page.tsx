"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import apiClient from "@/lib/api-client";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Plus,
  Lock,
  Unlock,
  Calendar,
} from "lucide-react";
import type { UserRole } from "@/lib/api";
import { useBranch } from "@/hooks/useBranch";
import { getCached, setCache, invalidateCache } from "@/lib/cache";
// ── Types ──

interface SlotItem {
  _id: string;
  staffId: { _id: string; name: string } | string;
  date: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "COMPLETED";
  appointmentId: string | null;
  blockReason: string | null;
}

interface BranchOption {
  _id: string;
  name: string;
}

interface StaffOption {
  _id: string;
  name: string;
}

// ── Helpers ──

function formatDateDisplay(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

import { toLocalDateStr } from "@/lib/utils";

function getToday(): string {
  return toLocalDateStr();
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

function getWeekDates(startDate: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return toLocalDateStr(d);
}

function getStaffName(staffId: SlotItem["staffId"]): string {
  if (typeof staffId === "object" && staffId !== null) return staffId.name;
  return "Unknown";
}

function getStaffId(staffId: SlotItem["staffId"]): string {
  if (typeof staffId === "object" && staffId !== null) return staffId._id;
  return String(staffId);
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  AVAILABLE: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Available" },
  BOOKED: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Booked" },
  BLOCKED: { bg: "bg-red-50 border-red-200", text: "text-red-400", label: "Blocked" },
  COMPLETED: { bg: "bg-gray-50 border-gray-200", text: "text-gray-400", label: "Done" },
};

// ── Page ──

export default function SchedulePage() {
  // const { user } = useSelector((state: RootState) => state.auth);
  // const role = (user?.role || "staff") as UserRole;
  // const canManage = role === "owner" || role === "manager";

  // const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  // const decoded = token ? JSON.parse(atob(token.split(".")[1])) : null;
  // const salonId = decoded?.salonId || "";
  // const userBranchId = decoded?.branchId || "";

  // const [branches, setBranches] = useState<BranchOption[]>([]);
  // const [selectedBranch, setSelectedBranch] = useState("");

  // Inside the component:
  const { branchId, salonId, role, canManage } = useBranch();
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [staffFilter, setStaffFilter] = useState("all");

  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const searchParams = useSearchParams();
  const dateParam = searchParams?.get("date");

  const [selectedDate, setSelectedDate] = useState(dateParam || getToday());
  const [weekStart, setWeekStart] = useState(getMonday(dateParam || getToday()));

  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [weekSlots, setWeekSlots] = useState<Record<string, SlotItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Fetch branches
  // useEffect(() => {
  //   if (!salonId) return;
  //   async function fetchBranches() {
  //     try {
  //       const { data } = await apiClient.get(`/salons/${salonId}/branches`);
  //       const list = data.data?.branches || [];
  //       setBranches(list);
  //       if (role === "manager" && userBranchId) {
  //         setSelectedBranch(userBranchId);
  //       } else if (list.length > 0) {
  //         setSelectedBranch(list[0]._id);
  //       }
  //     } catch {
  //       setError("Failed to load branches");
  //     }
  //   }
  //   fetchBranches();
  // }, [salonId, role, userBranchId]);

  // Fetch staff
  useEffect(() => {
    if (!branchId) return;
    async function fetchStaff() {
      try {
        const { data } = await apiClient.get(`/branches/${branchId}/staff`);
        const list = (data.data?.staff || []).filter((s: any) => s.isActive);
        setStaffList(list.map((s: any) => ({ _id: s._id, name: s.name })));
      } catch { }
    }
    fetchStaff();
  }, [branchId]);

  // Clear slots when branch changes
  useEffect(() => {
    setSlots([]);
    setWeekSlots({});
  }, [branchId]);

  // Fetch slots — day view
  const fetchDaySlots = useCallback(async () => {
    if (!branchId) return;

    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/branches/${branchId}/slots`, {
        params: { date: selectedDate, status: "all" },
      });
      const list = data.data?.slots || [];
      setSlots(list);
    } catch {
      setError("Failed to load slots");
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedDate]);

  // Fetch slots — week view
  const fetchWeekSlots = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    setWeekSlots({});
    try {
      const dates = getWeekDates(weekStart);
      const results = await Promise.all(
        dates.map((date) =>
          apiClient.get(`/branches/${branchId}/slots`, { params: { date, status: "all" } }),
        ),
      );
      const map: Record<string, SlotItem[]> = {};
      dates.forEach((date, i) => {
        map[date] = results[i].data.data?.slots || [];
      });
      setWeekSlots(map);
    } catch {
      setError("Failed to load weekly slots");
    } finally {
      setLoading(false);
    }
  }, [branchId, weekStart]);

  useEffect(() => {
    if (viewMode === "day") fetchDaySlots();
    else fetchWeekSlots();
  }, [viewMode, fetchDaySlots, fetchWeekSlots]);

  // Filter slots by staff
  function filterSlots(slotList: SlotItem[]): SlotItem[] {
    if (staffFilter === "all") return slotList;
    return slotList.filter((s) => getStaffId(s.staffId) === staffFilter);
  }

  // Group slots by staff
  function groupByStaff(slotList: SlotItem[]): Record<string, { name: string; slots: SlotItem[] }> {
    const groups: Record<string, { name: string; slots: SlotItem[] }> = {};

    // Pre-fill groups with staff members so staff with 0 slots are still visible
    const relevantStaff =
      staffFilter === "all"
        ? staffList
        : staffList.filter((s) => s._id === staffFilter);

    relevantStaff.forEach((st) => {
      groups[st._id] = { name: st.name, slots: [] };
    });

    slotList.forEach((s) => {
      const id = getStaffId(s.staffId);
      const name = getStaffName(s.staffId);
      if (!groups[id]) groups[id] = { name, slots: [] };
      groups[id].slots.push(s);
    });

    // Sort slots by time within each group
    Object.values(groups).forEach((g) =>
      g.slots.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    );
    return groups;
  }

  // Toggle block/unblock
  async function toggleSlot(slot: SlotItem) {
    if (slot.status === "BOOKED" || slot.status === "COMPLETED") return;
    setTogglingId(slot._id);
    try {
      const action = slot.status === "BLOCKED" ? "unblock" : "block";
      const reason = `Blocked by ${role}`;
      await apiClient.patch(
        `/branches/${branchId}/slots/${slot._id}/${action}`,
        action === "block" ? { reason } : {},
      );
      invalidateCache("slots_");
      if (viewMode === "day") fetchDaySlots();
      else fetchWeekSlots();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update slot");
    } finally {
      setTogglingId(null);
    }
  }

  const filteredSlots = filterSlots(slots);
  const grouped = groupByStaff(filteredSlots);

  return (
    <ProtectedRoute page="schedule">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-4xl text-ink">Schedule</h2>
            <div className="w-8 h-px bg-gold mt-3" />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={viewMode === "day" ? fetchDaySlots : fetchWeekSlots}
              loading={loading}
            >
              Refresh
            </Button>
            {canManage && (
              <Button size="sm" icon={<Plus size={13} />} onClick={() => setShowGenerateModal(true)}>
                Generate Slots
              </Button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-white border border-smoke rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("day")}
              className={`px-4 py-2 text-[11px] font-medium uppercase tracking-wider transition-all ${viewMode === "day" ? "bg-ink text-white" : "text-ash hover:text-ink"
                }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 text-[11px] font-medium uppercase tracking-wider transition-all ${viewMode === "week" ? "bg-ink text-white" : "text-ash hover:text-ink"
                }`}
            >
              Week
            </button>
          </div>

          {/* Date navigation */}
          {viewMode === "day" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="p-1.5 rounded-lg hover:bg-smoke transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="p-1.5 rounded-lg hover:bg-smoke transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setSelectedDate(getToday())}
                className="text-[11px] font-medium text-gold hover:text-gold/80 ml-1"
              >
                Today
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="p-1.5 rounded-lg hover:bg-smoke transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium px-2">
                {formatDateShort(weekStart)} — {formatDateShort(addDays(weekStart, 6))}
              </span>
              <button
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="p-1.5 rounded-lg hover:bg-smoke transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setWeekStart(getMonday(getToday()))}
                className="text-[11px] font-medium text-gold hover:text-gold/80 ml-1"
              >
                This Week
              </button>
            </div>
          )}

          {/* Branch selector */}
          {/* {role === "owner" && branches.length > 1 && (
            <Select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              options={branches.map((b) => ({ value: b._id, label: b.name }))}
            />
          )} */}

          {/* Staff filter */}
          {staffList.length > 0 && (
            <Select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              options={[
                { value: "all", label: "All Staff" },
                ...staffList.map((s) => ({ value: s._id, label: s.name })),
              ]}
            />
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-4 py-3">
            <AlertCircle size={14} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4">
          {Object.entries(STATUS_STYLES).map(([key, style]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded border ${style.bg}`} />
              <span className="text-[10px] text-ash">{style.label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-subtle flex items-center gap-3">
                  <div className="animate-pulse bg-border/50 rounded-lg w-8 h-8" />
                  <div className="space-y-1.5">
                    <div className="animate-pulse bg-border/50 rounded h-3.5 w-24" />
                    <div className="animate-pulse bg-border/50 rounded h-3 w-32" />
                  </div>
                </div>
                <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5 p-4">
                  {Array.from({ length: 12 }).map((_, j) => (
                    <div key={j} className="animate-pulse bg-border/30 rounded-lg h-14" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === "day" ? (
          /* ── Day View ── */
          Object.keys(grouped).length === 0 ? (
            <div className="text-center text-ash py-16 text-sm">
              <Calendar size={24} className="mx-auto mb-2 text-silver" />
              <p>No slots for {formatDateDisplay(selectedDate)}</p>
              {canManage && (
                <p className="text-xs mt-1">Click "Generate Slots" to create time slots.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xs text-ash">{formatDateDisplay(selectedDate)}</p>
              {Object.entries(grouped).map(([staffId, { name, slots: staffSlots }]) => (
                <div key={staffId} className="bg-white border border-smoke rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-smoke bg-smoke/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center text-[10px] font-semibold">
                      {name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-[10px] text-ash">
                        {staffSlots.filter((s) => s.status === "AVAILABLE").length} available ·{" "}
                        {staffSlots.filter((s) => s.status === "BOOKED").length} booked ·{" "}
                        {staffSlots.filter((s) => s.status === "BLOCKED").length} blocked
                      </p>
                    </div>
                  </div>
                  {staffSlots.length === 0 ? (
                    <div className="p-4 text-xs text-ash flex items-center justify-between bg-smoke/10">
                      <span>No time slots generated for {name} on {formatDateShort(selectedDate)}</span>
                      {canManage && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Plus size={13} />}
                          onClick={() => setShowGenerateModal(true)}
                        >
                          Generate Slots
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5 p-4">
                      {staffSlots.map((slot) => {
                        const style = STATUS_STYLES[slot.status] || STATUS_STYLES.AVAILABLE;
                        const isToggleable =
                          canManage && (slot.status === "AVAILABLE" || slot.status === "BLOCKED");
                        return (
                          <button
                            key={slot._id}
                            onClick={() => isToggleable && toggleSlot(slot)}
                            disabled={togglingId === slot._id || !isToggleable}
                            className={`
                              border rounded-lg px-2 py-2 text-center transition-all
                              ${style.bg} ${style.text}
                              ${isToggleable ? "cursor-pointer hover:shadow-md hover:scale-105" : "cursor-default"}
                              ${togglingId === slot._id ? "opacity-50" : ""}
                            `}
                            title={
                              slot.status === "BLOCKED"
                                ? `Blocked: ${slot.blockReason || "No reason"}`
                                : slot.status === "BOOKED"
                                  ? "Booked — cannot modify"
                                  : `${slot.startTime} - ${slot.endTime}`
                            }
                          >
                            <p className="text-[11px] font-semibold">{slot.startTime}</p>
                            <p className="text-[8px] uppercase tracking-wider mt-0.5 opacity-70">
                              {style.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* ── Week View ── */
          <div className="bg-white border border-smoke rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-smoke bg-smoke/30">
                    <th className="text-left text-xs font-medium text-ash px-4 py-3 w-24">Staff</th>
                    {getWeekDates(weekStart).map((date) => (
                      <th
                        key={date}
                        className={`text-center text-xs font-medium px-2 py-3 ${date === getToday() ? "text-gold" : "text-ash"
                          }`}
                      >
                        {formatDateShort(date)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffList
                    .filter((s) => staffFilter === "all" || s._id === staffFilter)
                    .map((staff) => (
                      <tr key={staff._id} className="border-b border-smoke/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-smoke text-ink flex items-center justify-center text-[9px] font-semibold shrink-0">
                              {staff.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                            </div>
                            <span className="text-xs font-medium truncate">{staff.name}</span>
                          </div>
                        </td>
                        {getWeekDates(weekStart).map((date) => {
                          const daySlots = (weekSlots[date] || []).filter(
                            (s) => getStaffId(s.staffId) === staff._id,
                          );
                          const available = daySlots.filter((s) => s.status === "AVAILABLE").length;
                          const booked = daySlots.filter((s) => s.status === "BOOKED").length;
                          const blocked = daySlots.filter((s) => s.status === "BLOCKED").length;
                          const total = daySlots.length;

                          return (
                            <td
                              key={date}
                              className={`text-center px-2 py-3 ${date === getToday() ? "bg-gold/5" : ""
                                }`}
                            >
                              {total === 0 ? (
                                <span className="text-[10px] text-silver">—</span>
                              ) : (
                                <div
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setSelectedDate(date);
                                    setStaffFilter(staff._id);
                                    setViewMode("day");
                                  }}
                                >
                                  <div className="flex justify-center gap-0.5 mb-1">
                                    {available > 0 && (
                                      <div
                                        className="h-1.5 rounded-full bg-emerald-400"
                                        style={{ width: `${(available / total) * 40}px` }}
                                      />
                                    )}
                                    {booked > 0 && (
                                      <div
                                        className="h-1.5 rounded-full bg-blue-400"
                                        style={{ width: `${(booked / total) * 40}px` }}
                                      />
                                    )}
                                    {blocked > 0 && (
                                      <div
                                        className="h-1.5 rounded-full bg-red-300"
                                        style={{ width: `${(blocked / total) * 40}px` }}
                                      />
                                    )}
                                  </div>
                                  <p className="text-[10px] text-ash">
                                    {available}<span className="text-silver">/</span>{total}
                                  </p>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Generate Slots Modal */}
        {showGenerateModal && (
          <GenerateSlotsModal
            branchId={branchId}
            staffList={staffList}
            onSuccess={() => {
              setShowGenerateModal(false);
              invalidateCache("slots_");
              if (viewMode === "day") fetchDaySlots();
              else fetchWeekSlots();
            }}
            onClose={() => setShowGenerateModal(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// ── Generate Slots Modal ──

function GenerateSlotsModal({
  branchId,
  staffList,
  onSuccess,
  onClose,
}: {
  branchId: string;
  staffList: StaffOption[];
  onSuccess: () => void;
  onClose: () => void;
}) {
  const today = getToday();
  const [form, setForm] = useState({
    staffId: staffList[0]?._id || "",
    startDate: today,
    endDate: addDays(today, 6),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);

  async function handleSubmit() {
    if (!form.staffId || !form.startDate || !form.endDate) {
      setError("All fields are required");
      return;
    }

    setSaving(true);
    setError(null);
    setResult(null);

    try {
      const { data } = await apiClient.post(`/branches/${branchId}/slots/generate`, {
        staffId: form.staffId,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setResult(data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate slots");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Generate Time Slots" onClose={onClose}>
      <div className="space-y-4">
        <Select
          label="Staff Member"
          value={form.staffId}
          onChange={(e) => setForm((p) => ({ ...p, staffId: e.target.value }))}
          options={staffList.map((s) => ({ value: s._id, label: s.name }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
          />
          <Input
            label="End Date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-3 py-2.5">
            <AlertCircle size={14} />
            <p className="text-xs">{error}</p>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2.5">
            <p className="text-xs font-medium">
              {result.inserted} slots created, {result.skipped} skipped (already exist)
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        {result ? (
          <Button className="flex-1" onClick={onSuccess}>
            Done
          </Button>
        ) : (
          <Button className="flex-1" onClick={handleSubmit} loading={saving}>
            Generate
          </Button>
        )}
      </div>
    </Modal>
  );
}