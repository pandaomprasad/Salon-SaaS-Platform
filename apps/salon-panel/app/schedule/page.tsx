"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { selectBranch } from "@/store/slices/authSlice";
import ProtectedRoute from "@/components/ProtectedRoute";
import Modal from "@/components/ui/Modal";
import apiClient from "@/lib/api-client";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Plus,
  Calendar,
  User,
  CalendarDays,
  Phone,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useBranch } from "@/hooks/useBranch";
import { invalidateCache } from "@/lib/cache";
import { toLocalDateStr } from "@/lib/utils";
import { socketClient } from "@/lib/socket-client";

// ── Types ──

export interface AppointmentDetails {
  _id?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceName?: string;
  serviceDuration?: number;
  status?: string;
  startTime?: string;
  endTime?: string;
}

interface SlotItem {
  _id: string;
  staffId: { _id: string; name: string } | string;
  date: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "COMPLETED";
  appointmentId: string | null;
  appointmentDetails?: AppointmentDetails | null;
  blockReason: string | null;
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

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; subtext: string; label: string }> = {
  AVAILABLE: {
    bg: "bg-[#f0fdf4]",
    border: "border-[#dcfce7]",
    text: "text-[#15803d]",
    subtext: "text-[#16a34a]",
    label: "Available",
  },
  BOOKED: {
    bg: "bg-[#eff6ff]",
    border: "border-[#dbeafe]",
    text: "text-[#1d4ed8]",
    subtext: "text-[#2563eb]",
    label: "Booked",
  },
  BLOCKED: {
    bg: "bg-[#fff1f2]",
    border: "border-[#ffe4e6]",
    text: "text-[#be123c]",
    subtext: "text-[#e11d48]",
    label: "Blocked",
  },
  COMPLETED: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-500",
    subtext: "text-slate-400",
    label: "Done",
  },
};

// ── Page ──

export default function SchedulePage() {
  const dispatch = useDispatch();
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
  const [selectedStaffForGenerate, setSelectedStaffForGenerate] = useState<string | null>(null);

  // Auto-fetch branches if branchId is not yet initialized
  useEffect(() => {
    if (branchId || !salonId) return;
    async function fetchBranches() {
      try {
        const { data } = await apiClient.get(`/salons/${salonId}/branches`);
        const list = data.data?.branches || data.branches || (Array.isArray(data) ? data : []);
        if (list.length > 0) {
          dispatch(selectBranch(list[0]));
        }
      } catch {
        setError("Failed to load branches");
      }
    }
    fetchBranches();
  }, [branchId, salonId, dispatch]);

  // Fetch staff
  useEffect(() => {
    if (!branchId) return;
    async function fetchStaff() {
      try {
        const { data } = await apiClient.get(`/branches/${branchId}/staff`);
        const list = (data.data?.staff || data.staff || []).filter((s: any) => s.isActive);
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
  const fetchDaySlots = useCallback(
    async (isSilent = false) => {
      if (!branchId) return;

      if (!isSilent) {
        setLoading(true);
        setError(null);
      }
      try {
        const { data } = await apiClient.get(`/branches/${branchId}/slots`, {
          params: { date: selectedDate, status: "all" },
        });
        const resData = data?.data || data;
        const list = Array.isArray(resData)
          ? resData
          : (resData?.slots || data?.slots || []);
        setSlots(list);
      } catch (err: any) {
        console.error("Failed to fetch day slots:", err);
        if (!isSilent) {
          setError(err.response?.data?.message || err.message || "Failed to load slots");
        }
      } finally {
        if (!isSilent) {
          setLoading(false);
        }
      }
    },
    [branchId, selectedDate],
  );

  // Fetch slots — week view
  const fetchWeekSlots = useCallback(
    async (isSilent = false) => {
      if (!branchId) return;
      if (!isSilent) {
        setLoading(true);
        setError(null);
        setWeekSlots({});
      }
      try {
        const dates = getWeekDates(weekStart);
        const results = await Promise.all(
          dates.map((date) =>
            apiClient.get(`/branches/${branchId}/slots`, { params: { date, status: "all" } }),
          ),
        );
        const map: Record<string, SlotItem[]> = {};
        dates.forEach((date, i) => {
          const d = results[i]?.data;
          const resData = d?.data || d;
          map[date] = Array.isArray(resData)
            ? resData
            : (resData?.slots || d?.slots || []);
        });
        setWeekSlots(map);
      } catch (err: any) {
        console.error("Failed to fetch week slots:", err);
        if (!isSilent) {
          setError(err.response?.data?.message || err.message || "Failed to load weekly slots");
        }
      } finally {
        if (!isSilent) {
          setLoading(false);
        }
      }
    },
    [branchId, weekStart],
  );

  useEffect(() => {
    if (viewMode === "day") fetchDaySlots();
    else fetchWeekSlots();
  }, [viewMode, fetchDaySlots, fetchWeekSlots]);

  // Silent auto-refresh every 10 seconds to update slots automatically in real time
  useEffect(() => {
    if (!branchId) return;

    const interval = setInterval(() => {
      if (viewMode === "day") fetchDaySlots(true);
      else fetchWeekSlots(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [branchId, viewMode, fetchDaySlots, fetchWeekSlots]);

  // Real-time WebSocket event listener for live automatic updates
  useEffect(() => {
    if (!branchId) return;

    socketClient.connect({ branchId });

    const handleRealtimeUpdate = () => {
      if (viewMode === "day") fetchDaySlots(true);
      else fetchWeekSlots(true);
    };

    const cleanupCreated = socketClient.onAppointmentCreated(handleRealtimeUpdate);
    const cleanupUpdated = socketClient.onAppointmentUpdated(handleRealtimeUpdate);
    const cleanupStatus = socketClient.onAppointmentStatusChanged(handleRealtimeUpdate);

    return () => {
      cleanupCreated();
      cleanupUpdated();
      cleanupStatus();
    };
  }, [branchId, viewMode, fetchDaySlots, fetchWeekSlots]);

  // Filter slots by staff
  function filterSlots(slotList: SlotItem[]): SlotItem[] {
    if (staffFilter === "all") return slotList;
    return slotList.filter((s) => getStaffId(s.staffId) === staffFilter);
  }

  // Group slots by staff
  function groupByStaff(slotList: SlotItem[]): Record<string, { name: string; slots: SlotItem[] }> {
    const groups: Record<string, { name: string; slots: SlotItem[] }> = {};

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
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Schedule</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Manage staff availability and time slots for appointments.
            </p>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => (viewMode === "day" ? fetchDaySlots() : fetchWeekSlots())}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 rounded-2xl transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            {canManage && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-[#5542f6] hover:bg-[#4332e0] text-white rounded-2xl transition-all shadow-xs"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Generate Slots</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Control Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/60 shadow-2xs">
              <button
                onClick={() => setViewMode("day")}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  viewMode === "day"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  viewMode === "week"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Week
              </button>
            </div>

            {/* Date Navigation Picker */}
            {viewMode === "day" ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white transition-colors border border-transparent hover:border-slate-200/60"
                  title="Previous day"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none shadow-xs cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white transition-colors border border-transparent hover:border-slate-200/60"
                  title="Next day"
                >
                  <ChevronRight size={16} />
                </button>

                <button
                  onClick={() => setSelectedDate(getToday())}
                  className="bg-[#f0f7ff] text-[#5542f6] border border-[#e0f2fe] hover:bg-[#e0f2fe] rounded-xl px-4 py-2 text-xs font-extrabold transition-all shadow-2xs ml-1"
                >
                  Today
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWeekStart(addDays(weekStart, -7))}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white transition-colors border border-transparent hover:border-slate-200/60"
                  title="Previous week"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold px-3 py-2 bg-white border border-slate-200/90 rounded-xl shadow-xs text-slate-800">
                  {formatDateShort(weekStart)} — {formatDateShort(addDays(weekStart, 6))}
                </span>
                <button
                  onClick={() => setWeekStart(addDays(weekStart, 7))}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white transition-colors border border-transparent hover:border-slate-200/60"
                  title="Next week"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setWeekStart(getMonday(getToday()))}
                  className="bg-[#f0f7ff] text-[#5542f6] border border-[#e0f2fe] hover:bg-[#e0f2fe] rounded-xl px-4 py-2 text-xs font-extrabold transition-all shadow-2xs ml-1"
                >
                  This Week
                </button>
              </div>
            )}

            {/* Staff Filter Dropdown */}
            {staffList.length > 0 && (
              <div className="relative w-48">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-800 appearance-none focus:outline-none shadow-xs cursor-pointer"
                >
                  <option value="all">All Staff</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>
            )}
          </div>

          <div className="text-xs font-bold text-slate-400 hidden lg:block">
            {formatDateDisplay(selectedDate)}
          </div>
        </div>

        {/* Status Legend Row */}
        <div className="flex items-center gap-6 py-2 px-1 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
            <span className="text-xs font-bold text-slate-700">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
            <span className="text-xs font-bold text-slate-700">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-xs font-bold text-slate-700">Done</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center justify-between text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs font-medium mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} />
              <p>{error}</p>
            </div>
            <button
              onClick={() => (viewMode === "day" ? fetchDaySlots() : fetchWeekSlots())}
              className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Schedule Grid Body */}
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="animate-pulse bg-slate-200/70 rounded-full w-10 h-10" />
                  <div className="space-y-1.5">
                    <div className="animate-pulse bg-slate-200/70 rounded h-4 w-32" />
                    <div className="animate-pulse bg-slate-200/70 rounded h-3 w-48" />
                  </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 pt-2">
                  {Array.from({ length: 16 }).map((_, j) => (
                    <div key={j} className="animate-pulse bg-slate-200/50 rounded-xl h-14" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === "day" ? (
          /* ── Day View ── */
          Object.keys(grouped).length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 shadow-xs">
              <Calendar size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No staff members or slots found for {formatDateDisplay(selectedDate)}</p>
              {canManage && (
                <p className="text-xs text-slate-400 mt-1">Click "Generate Slots" to create time slots.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([staffId, { name, slots: staffSlots }]) => {
                const availCount = staffSlots.filter((s) => s.status === "AVAILABLE").length;
                const bookCount = staffSlots.filter((s) => s.status === "BOOKED").length;
                const blockCount = staffSlots.filter((s) => s.status === "BLOCKED").length;

                return (
                  <div key={staffId} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
                    {/* Staff Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                          {getInitials(name)}
                        </div>
                        <div>
                          <h2 className="text-base font-black text-slate-900 leading-tight">{name}</h2>
                          <p className="text-xs font-medium text-slate-400 mt-0.5">
                            {availCount} available · {bookCount} booked · {blockCount} blocked
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canManage && staffSlots.length === 0 && (
                          <button
                            onClick={() => {
                              setSelectedStaffForGenerate(staffId);
                              setShowGenerateModal(true);
                            }}
                            className="bg-white text-[#5542f6] border border-[#5542f6]/30 hover:bg-[#5542f6]/5 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                            <span>Generate Slots</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Slots Grid / Empty Placeholder */}
                    {staffSlots.length === 0 ? (
                      <div className="text-center py-10 px-4 bg-slate-50/40 rounded-2xl border border-dashed border-slate-200/80 mt-3">
                        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3 shadow-2xs">
                          <CalendarDays size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-600">
                          No time slots generated for {name} on {formatDateShort(selectedDate)}.
                        </p>
                        {canManage && (
                          <button
                            onClick={() => {
                              setSelectedStaffForGenerate(staffId);
                              setShowGenerateModal(true);
                            }}
                            className="bg-[#5542f6] hover:bg-[#4332e0] text-white font-bold text-xs px-5 py-2.5 rounded-xl mt-4 shadow-xs transition-all inline-flex items-center gap-1.5"
                          >
                            <Plus size={14} strokeWidth={2.5} />
                            <span>Generate Slots</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                        {staffSlots.map((slot) => {
                          const style = STATUS_STYLES[slot.status] || STATUS_STYLES.AVAILABLE;
                          const isToggleable =
                            canManage && (slot.status === "AVAILABLE" || slot.status === "BLOCKED");
                          const isBookedOrCompleted = slot.status === "BOOKED" || slot.status === "COMPLETED";
                          const appt = slot.appointmentDetails;

                          return (
                            <div key={slot._id} className="relative group">
                              <button
                                onClick={() => isToggleable && toggleSlot(slot)}
                                disabled={togglingId === slot._id || !isToggleable}
                                className={`
                                  w-full border rounded-xl p-3 text-center transition-all
                                  ${style.bg} ${style.border}
                                  ${isToggleable ? "cursor-pointer hover:shadow-xs hover:scale-[1.02]" : "cursor-default"}
                                  ${togglingId === slot._id ? "opacity-50" : ""}
                                `}
                              >
                                <p className={`text-xs font-black ${style.text}`}>{slot.startTime}</p>
                                <p className={`text-[10px] font-semibold tracking-tight mt-0.5 ${style.subtext}`}>
                                  {style.label}
                                </p>
                              </button>

                              {/* Hover Tooltip / Popover Card */}
                              {isBookedOrCompleted ? (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 w-56 sm:w-60 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-out transform scale-95 group-hover:scale-100 origin-bottom">
                                  <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-slate-200/90 text-left relative overflow-hidden">
                                    {/* Accent Header Bar */}
                                    {(() => {
                                      const isDone = slot.status === "COMPLETED" || appt?.status?.toUpperCase() === "COMPLETED";
                                      return (
                                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                                          <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                              isDone ? "bg-slate-100 text-slate-600" : "bg-[#efeefd] text-[#5542f6]"
                                            }`}
                                          >
                                            <span
                                              className={`w-1.5 h-1.5 rounded-full ${
                                                isDone ? "bg-slate-400" : "bg-[#5542f6] animate-pulse"
                                              }`}
                                            />
                                            {appt?.status || (isDone ? "Completed" : "Booked")}
                                          </span>
                                          <span className="text-[11px] font-bold text-slate-500">
                                            {slot.startTime} - {slot.endTime}
                                          </span>
                                        </div>
                                      );
                                    })()}

                                    {/* Appointment Name & Customer */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-[#efeefd] text-[#5542f6] border border-[#5542f6]/20 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                                          <User size={14} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-black text-slate-900 truncate capitalize">
                                            {appt?.customerName || "Customer Appointment"}
                                          </p>
                                          <p className="text-[10px] font-bold text-slate-400">Appointment Name</p>
                                        </div>
                                      </div>

                                      {/* Service Details Badge */}
                                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                          <Sparkles size={13} className="text-[#5542f6] shrink-0" />
                                          <span className="text-xs font-bold text-slate-800 truncate">
                                            {appt?.serviceName || "Service"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shrink-0">
                                          <Clock size={10} />
                                          <span>{appt?.serviceDuration || 30}m</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Arrow */}
                                  <div className="w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white mx-auto -mt-0.5 drop-shadow-xs" />
                                </div>
                              ) : slot.status === "BLOCKED" && slot.blockReason ? (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 w-48 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 transform scale-95 group-hover:scale-100 origin-bottom">
                                  <div className="bg-rose-50 text-rose-800 p-2.5 rounded-xl text-xs font-medium border border-rose-200 shadow-md text-center">
                                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">
                                      Blocked Reason
                                    </p>
                                    <p className="text-xs font-bold text-rose-900">{slot.blockReason}</p>
                                  </div>
                                  <div className="w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-rose-50 mx-auto -mt-0.5" />
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ── Week View ── */
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 w-32 uppercase tracking-wider">Staff</th>
                    {getWeekDates(weekStart).map((date) => (
                      <th
                        key={date}
                        className={`text-center text-xs font-bold px-3 py-3.5 uppercase tracking-wider ${
                          date === getToday() ? "text-[#5542f6]" : "text-slate-500"
                        }`}
                      >
                        {formatDateShort(date)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {staffList
                    .filter((s) => staffFilter === "all" || s._id === staffFilter)
                    .map((staff) => (
                      <tr key={staff._id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                              {getInitials(staff.name)}
                            </div>
                            <span className="text-xs font-bold text-slate-900 truncate">{staff.name}</span>
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
                              className={`text-center px-3 py-4 ${
                                date === getToday() ? "bg-[#efeefd]/30" : ""
                              }`}
                            >
                              {total === 0 ? (
                                <span className="text-xs font-semibold text-slate-300">—</span>
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
                                        style={{ width: `${(available / total) * 36}px` }}
                                      />
                                    )}
                                    {booked > 0 && (
                                      <div
                                        className="h-1.5 rounded-full bg-blue-500"
                                        style={{ width: `${(booked / total) * 36}px` }}
                                      />
                                    )}
                                    {blocked > 0 && (
                                      <div
                                        className="h-1.5 rounded-full bg-rose-400"
                                        style={{ width: `${(blocked / total) * 36}px` }}
                                      />
                                    )}
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-600">
                                    {available}<span className="text-slate-300">/</span>{total}
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
            initialStaffId={selectedStaffForGenerate}
            defaultDate={selectedDate}
            onSuccess={() => {
              setShowGenerateModal(false);
              setSelectedStaffForGenerate(null);
              invalidateCache("slots_");
              if (viewMode === "day") fetchDaySlots();
              else fetchWeekSlots();
            }}
            onClose={() => {
              setShowGenerateModal(false);
              setSelectedStaffForGenerate(null);
            }}
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
  initialStaffId,
  defaultDate,
  onSuccess,
  onClose,
}: {
  branchId: string;
  staffList: StaffOption[];
  initialStaffId?: string | null;
  defaultDate?: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const baseDate = defaultDate || getToday();
  const [form, setForm] = useState({
    staffId: initialStaffId || staffList[0]?._id || "",
    startDate: baseDate,
    endDate: addDays(baseDate, 6),
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
      <div className="space-y-4 pt-1">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Staff Member</label>
          <select
            value={form.staffId}
            onChange={(e) => setForm((p) => ({ ...p, staffId: e.target.value }))}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none shadow-xs"
          >
            {staffList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none shadow-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none shadow-xs"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 rounded-xl px-3 py-2.5 text-xs font-medium">
            <AlertCircle size={14} />
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2.5 text-xs font-bold">
            <p>
              {result.inserted} slots created, {result.skipped} skipped (already exist)
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6 border-t border-slate-100 pt-4">
        <button
          onClick={onClose}
          className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs"
        >
          Cancel
        </button>
        {result ? (
          <button
            onClick={onSuccess}
            className="flex-1 bg-[#5542f6] hover:bg-[#4332e0] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs"
          >
            Done
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-[#5542f6] hover:bg-[#4332e0] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs disabled:opacity-50"
          >
            {saving ? "Generating..." : "Generate"}
          </button>
        )}
      </div>
    </Modal>
  );
}