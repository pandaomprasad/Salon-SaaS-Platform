"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import apiClient from "@/lib/api-client";
import {
  RefreshCw,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import { toLocalDateStr } from "@/lib/utils";

// ── Types ──

interface ChangeInfo {
  pct: number;
  text: string;
  direction: "up" | "down" | "neutral";
}

interface Overview {
  period: { startDate: string; endDate: string };
  appointments: {
    total: number;
    totalChange?: ChangeInfo;
    completed: number;
    completedChange?: ChangeInfo;
    cancelled: number;
    cancelledChange?: ChangeInfo;
    pending: number;
    confirmed: number;
    pendingChange?: ChangeInfo;
    noShow: number;
    noShowChange?: ChangeInfo;
    completionRate: string;
  };
  revenue: {
    total: number;
    change?: ChangeInfo;
  };
}

function ChangeBadge({ change }: { change?: ChangeInfo }) {
  if (!change || change.direction === "neutral") {
    return <p className="text-[11px] font-bold text-slate-500 mb-2">0% from last period</p>;
  }
  if (change.direction === "up") {
    return (
      <p className="text-[11px] font-bold text-emerald-600 mb-2 flex items-center gap-0.5">
        <ArrowUpRight size={13} /> {change.text} from last period
      </p>
    );
  }
  return (
    <p className="text-[11px] font-bold text-rose-500 mb-2 flex items-center gap-0.5">
      <ArrowDownRight size={13} /> {change.text} from last period
    </p>
  );
}

interface PopularService {
  serviceId: string;
  name: string;
  category: string;
  totalBookings: number;
  totalRevenue: number;
}

interface StaffPerf {
  staffId: string;
  name: string;
  email: string;
  totalAppointments: number;
  completedAppointments?: number;
  cancelledAppointments?: number;
  noShowAppointments?: number;
  totalRevenue: number;
  avgRating: string | number;
}

interface DailyBooking {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

// ── Helpers ──

function formatPrice(price: number): string {
  return `₹${(price / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  return `${s.toLocaleDateString("en-IN", opts)} – ${e.toLocaleDateString("en-IN", opts)}`;
}

function getPresetDates(preset: string): { startDate: string; endDate: string } {
  const now = new Date();
  const fmt = (d: Date) => toLocalDateStr(d);
  switch (preset) {
    case "today":
      return { startDate: fmt(now), endDate: fmt(now) };
    case "week": {
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      return { startDate: fmt(s), endDate: fmt(now) };
    }
    case "month":
      return {
        startDate: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    case "quarter": {
      const s = new Date(now);
      s.setMonth(s.getMonth() - 3);
      return { startDate: fmt(s), endDate: fmt(now) };
    }
    default:
      return {
        startDate: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
  }
}

function getInitials(name: string): string {
  if (!name) return "ST";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function fillDateRange(startStr: string, endStr: string, existing: DailyBooking[]): DailyBooking[] {
  if (!startStr || !endStr) return existing;
  const map = new Map<string, DailyBooking>();
  existing.forEach((item) => map.set(item.date, item));

  const result: DailyBooking[] = [];
  const curr = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");

  if (isNaN(curr.getTime()) || isNaN(end.getTime()) || curr > end) return existing;

  let count = 0;
  while (curr <= end && count < 100) {
    const dateKey = toLocalDateStr(curr);
    if (map.has(dateKey)) {
      result.push(map.get(dateKey)!);
    } else {
      result.push({
        date: dateKey,
        total: 0,
        completed: 0,
        cancelled: 0,
        revenue: 0,
      });
    }
    curr.setDate(curr.getDate() + 1);
    count++;
  }

  return result.length > 0 ? result : existing;
}

const CATEGORY_COLORS: Record<string, string> = {
  hair: "#5542f6",
  skin: "#e11d48",
  nails: "#ec4899",
  makeup: "#d97706",
  spa: "#0d9488",
  other: "#64748b",
};

// SVG Sparkline Component
function Sparkline({ color }: { color: string }) {
  return (
    <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
      <path
        d="M0 20 C 20 15, 40 22, 60 10 C 80 18, 90 5, 100 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ── Page ──

export default function ReportsPage() {
  const [preset, setPreset] = useState("month");
  const [dates, setDates] = useState(getPresetDates("month"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [popularServices, setPopularServices] = useState<PopularService[]>([]);
  const [staffPerf, setStaffPerf] = useState<StaffPerf[]>([]);
  const [dailyBookings, setDailyBookings] = useState<DailyBooking[]>([]);
  const [hoveredDay, setHoveredDay] = useState<DailyBooking | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { startDate: dates.startDate, endDate: dates.endDate };

      const overviewRes = await apiClient.get("/reports/overview", { params });
      setOverview(overviewRes.data.data);
      setLoading(false);

      const [popularRes, staffRes, dailyRes] = await Promise.all([
        apiClient.get("/reports/popular-services", { params }),
        apiClient.get("/reports/staff-performance", { params }),
        apiClient.get("/reports/daily-bookings", { params }),
      ]);
      setPopularServices(popularRes.data.data?.popularServices || []);
      setStaffPerf(staffRes.data.data?.staffPerformance || []);
      setDailyBookings(dailyRes.data.data?.dailyBookings || []);
    } catch {
      setError("Failed to load reports");
      setLoading(false);
    }
  }, [dates]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  function handlePresetChange(value: string) {
    setPreset(value);
    if (value !== "custom") setDates(getPresetDates(value));
  }

  const fullDailyList = fillDateRange(dates.startDate, dates.endDate, dailyBookings);
  const maxRevenueVal = Math.max(...fullDailyList.map((d) => d.revenue), 100000);
  const maxBookingsVal = Math.max(...fullDailyList.map((d) => d.total), 5);

  const labelStep = fullDailyList.length > 20 ? 5 : fullDailyList.length > 10 ? 3 : 1;

  return (
    <ProtectedRoute page="reports">
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reports</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Insights into your salon's performance
            </p>
          </div>

          <button
            onClick={fetchReports}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 rounded-2xl transition-all shadow-xs disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Toolbar Period Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Date Range Display */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs">
              <Calendar size={15} className="text-slate-400" />
              <span>{formatDateRange(dates.startDate, dates.endDate)}</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/60 shadow-2xs flex-wrap">
            {[
              { value: "today", label: "Today" },
              { value: "week", label: "7 Days" },
              { value: "month", label: "Month" },
              { value: "quarter", label: "Quarter" },
              { value: "custom", label: "Custom" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handlePresetChange(opt.value)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  preset === opt.value
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dates.startDate}
                onChange={(e) => setDates((p) => ({ ...p, startDate: e.target.value }))}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-xs"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={dates.endDate}
                onChange={(e) => setDates((p) => ({ ...p, endDate: e.target.value }))}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-xs"
              />
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 text-rose-600 bg-rose-50 border border-rose-200/80 rounded-2xl px-4 py-3 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <p className="flex-1">{error}</p>
            <button onClick={fetchReports} className="underline font-bold hover:text-rose-800">
              Retry
            </button>
          </div>
        )}

        {/* 6 Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          
          {/* Card 1: Total Revenue */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <IndianRupee size={18} strokeWidth={2.5} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {overview ? formatPrice(overview.revenue.total) : "₹0"}
              </p>
            </div>
            <div className="mt-3">
              <ChangeBadge change={overview?.revenue?.change} />
              <Sparkline color="#3b82f6" />
            </div>
          </div>

          {/* Card 2: Total Bookings */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CalendarCheck size={18} strokeWidth={2.2} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bookings</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {overview ? overview.appointments.total : 0}
              </p>
            </div>
            <div className="mt-3">
              <ChangeBadge change={overview?.appointments?.totalChange} />
              <Sparkline color="#10b981" />
            </div>
          </div>

          {/* Card 3: Completed */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 size={18} strokeWidth={2.2} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {overview ? overview.appointments.completed : 0}
              </p>
            </div>
            <div className="mt-3">
              <ChangeBadge change={overview?.appointments?.completedChange} />
              <Sparkline color="#10b981" />
            </div>
          </div>

          {/* Card 4: Cancelled */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
                <XCircle size={18} strokeWidth={2.2} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cancelled</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {overview ? overview.appointments.cancelled : 0}
              </p>
            </div>
            <div className="mt-3">
              <ChangeBadge change={overview?.appointments?.cancelledChange} />
              <Sparkline color="#f43f5e" />
            </div>
          </div>

          {/* Card 5: Pending */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Clock size={18} strokeWidth={2.2} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {overview ? overview.appointments.pending + overview.appointments.confirmed : 0}
              </p>
            </div>
            <div className="mt-3">
              <ChangeBadge change={overview?.appointments?.pendingChange} />
              <Sparkline color="#f59e0b" />
            </div>
          </div>

          {/* Card 6: No Shows */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Users size={18} strokeWidth={2.2} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No Shows</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {overview ? overview.appointments.noShow : 0}
              </p>
            </div>
            <div className="mt-3">
              <ChangeBadge change={overview?.appointments?.noShowChange} />
              <Sparkline color="#a855f7" />
            </div>
          </div>

        </div>

        {/* Charts Grid Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Chart: Daily Activity (2 cols) */}
          <div className="xl:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Daily Activity</h3>
                <p className="text-xs font-medium text-slate-400 mt-0.5">Revenue and bookings breakdown</p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#5542f6]" />
                  <span className="text-slate-600">Revenue (₹)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Bookings</span>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Grid Lines + Y-Axis Labels */}
              <div className="flex gap-3 h-56">
                
                {/* Y-Axis Labels */}
                <div className="flex flex-col justify-between py-1 text-[10px] font-extrabold text-slate-400 shrink-0 w-8 text-right">
                  <span>{maxBookingsVal}</span>
                  <span>{Math.round(maxBookingsVal * 0.75)}</span>
                  <span>{Math.round(maxBookingsVal * 0.5)}</span>
                  <span>{Math.round(maxBookingsVal * 0.25)}</span>
                  <span>0</span>
                </div>

                {/* Bars & Horizontal Background Grid Container */}
                <div className="flex-1 relative border-b border-slate-200">
                  {/* Background Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-dashed border-slate-100 w-full h-0" />
                    <div className="border-b border-dashed border-slate-100 w-full h-0" />
                    <div className="border-b border-dashed border-slate-100 w-full h-0" />
                    <div className="border-b border-dashed border-slate-100 w-full h-0" />
                    <div className="border-b border-slate-100 w-full h-0" />
                  </div>

                  {/* Bars Container */}
                  <div className="flex items-end h-full relative z-10 px-1 gap-1">
                    {fullDailyList.map((d, i) => {
                      const revenuePct = Math.min((d.revenue / maxRevenueVal) * 100, 100);
                      const bookingPct = Math.min((d.total / maxBookingsVal) * 100, 100);
                      const isHovered = hoveredDay?.date === d.date;

                      return (
                        <div
                          key={d.date}
                          onMouseEnter={() => setHoveredDay(d)}
                          onMouseLeave={() => setHoveredDay(null)}
                          className="flex-1 flex flex-col items-center group relative h-full justify-end"
                        >
                          {/* Tooltip Popup */}
                          {isHovered && (
                            <div className="absolute bottom-full mb-3 z-30 pointer-events-none">
                              <div className="bg-slate-900 text-white text-[11px] p-3 rounded-2xl shadow-xl whitespace-nowrap space-y-1 border border-slate-700 animate-slide-up">
                                <p className="font-extrabold text-slate-200">{formatDateShort(d.date)} 2026</p>
                                <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                                  <div className="w-2 h-2 rounded-full bg-[#5542f6]" />
                                  <span>Revenue: {formatPrice(d.revenue)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                  <span>Bookings: {d.total} ({d.completed} completed, {d.cancelled} cancelled)</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Bar Column Wrapper */}
                          <div className="w-full max-w-[20px] mx-auto h-full flex items-end justify-center gap-0.5 rounded-t-md hover:bg-slate-50 transition-colors py-1 cursor-pointer">
                            {/* Revenue Bar */}
                            {d.revenue > 0 ? (
                              <div
                                className="w-1.5 sm:w-2 bg-gradient-to-t from-[#5542f6] to-[#818cf8] rounded-t-full transition-all group-hover:brightness-110 shadow-2xs"
                                style={{ height: `${Math.max(revenuePct, 8)}%` }}
                              />
                            ) : null}

                            {/* Booking Bar */}
                            {d.total > 0 ? (
                              <div
                                className="w-1.5 sm:w-2 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-full transition-all group-hover:brightness-110 shadow-2xs"
                                style={{ height: `${Math.max(bookingPct, 8)}%` }}
                              />
                            ) : null}

                            {/* Dot indicator when no revenue and no bookings */}
                            {d.revenue === 0 && d.total === 0 && (
                              <div className="h-1 w-1 bg-slate-200/80 rounded-full mb-0.5 group-hover:bg-slate-400 transition-colors" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* X Axis Labels */}
              <div className="flex gap-1 mt-2.5 ml-11">
                {fullDailyList.map((d, i) => {
                  const showLabel = i % labelStep === 0 || i === fullDailyList.length - 1;
                  return (
                    <div key={d.date} className="flex-1 text-center">
                      <span className="text-[10px] font-bold text-slate-400">
                        {showLabel ? formatDateShort(d.date) : ""}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Right Panel: Top Services (1 col) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Top Services</h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">Most booked services by revenue</p>
                </div>
                <Link
                  href="/reports/services-performance"
                  className="text-xs font-bold text-[#5542f6] hover:underline inline-flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {popularServices.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <BarChart3 size={24} />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800">No data yet</h4>
                  <p className="text-xs font-medium text-slate-400 mt-1 max-w-xs mx-auto">
                    Service data will appear here once you have bookings.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {popularServices.map((s) => {
                    const maxRev = popularServices[0]?.totalRevenue || 1;
                    const widthPct = Math.max((s.totalRevenue / maxRev) * 100, 10);
                    const color = CATEGORY_COLORS[s.category] || CATEGORY_COLORS.other;

                    return (
                      <div key={s.serviceId}>
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-900">{s.name}</span>
                          <span className="text-slate-900">{formatPrice(s.totalRevenue)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${widthPct}%`, backgroundColor: color }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">
                          {s.totalBookings} booking{s.totalBookings !== 1 ? "s" : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Staff Performance Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900">Staff Performance</h3>
              <p className="text-[11px] font-medium text-slate-500">
                Performance overview for the selected period
              </p>
            </div>
            <Link
              href="/reports/staff-performance"
              className="text-xs font-bold text-[#5542f6] hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {staffPerf.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">
              No staff performance records available for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80">
                    <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 w-12 text-center">#</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Staff</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 text-center">Total Bookings</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 text-center">Completed</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 text-center">Cancelled</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 text-center">No Shows</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 text-right">Revenue (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffPerf.map((s, index) => (
                    <tr key={s.staffId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-slate-400 text-center">
                        {index + 1}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {getInitials(s.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-slate-900 truncate">
                              {s.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-xs font-black text-slate-900 text-center">
                        {s.totalAppointments}
                      </td>

                      <td className="py-4 px-5 text-xs font-bold text-slate-600 text-center">
                        {s.completedAppointments || 0}
                      </td>

                      <td className="py-4 px-5 text-xs font-bold text-slate-600 text-center">
                        {s.cancelledAppointments || 0}
                      </td>

                      <td className="py-4 px-5 text-xs font-bold text-slate-600 text-center">
                        {s.noShowAppointments || 0}
                      </td>

                      <td className="py-4 px-5 text-xs font-black text-slate-900 text-right">
                        {formatPrice(s.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </ProtectedRoute>
  );
}