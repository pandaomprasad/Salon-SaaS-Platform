"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import apiClient from "@/lib/api-client";
import {
  RefreshCw,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  Users,
  CheckCircle,
  XCircle,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// ── Types ──

interface Overview {
  period: { startDate: string; endDate: string };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    confirmed: number;
    noShow: number;
    completionRate: string;
  };
  revenue: { total: number };
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
  return `₹${price.toLocaleString("en-IN")}`;
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  return `${s.toLocaleDateString("en-IN", opts)} — ${e.toLocaleDateString("en-IN", opts)}`;
}

function getPresetDates(preset: string): { startDate: string; endDate: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
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
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

const CATEGORY_COLORS: Record<string, string> = {
  hair: "#9333ea",
  skin: "#e11d48",
  nails: "#ec4899",
  makeup: "#d97706",
  spa: "#0d9488",
  other: "#6b7280",
};

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

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { startDate: dates.startDate, endDate: dates.endDate };
      const [o, p, s, d] = await Promise.all([
        apiClient.get("/reports/overview", { params }),
        apiClient.get("/reports/popular-services", { params }),
        apiClient.get("/reports/staff-performance", { params }),
        apiClient.get("/reports/daily-bookings", { params }),
      ]);
      setOverview(o.data.data);
      setPopularServices(p.data.data?.popularServices || []);
      setStaffPerf(s.data.data?.staffPerformance || []);
      setDailyBookings(d.data.data?.dailyBookings || []);
    } catch {
      setError("Failed to load reports");
    } finally {
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

  const maxRevenue = Math.max(...dailyBookings.map((d) => d.revenue), 1);
  const maxBookings = Math.max(...dailyBookings.map((d) => d.total), 1);

  return (
    <ProtectedRoute page="reports">
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-4xl text-ink">Reports</h2>
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={fetchReports}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
          <p className="text-xs text-ash mt-2 tracking-wide">
            {formatDateRange(dates.startDate, dates.endDate)}
          </p>
          <div className="w-8 h-px bg-gold mt-3" />
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex bg-white border border-smoke rounded-xl overflow-hidden">
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
                className={`px-4 py-2 text-[11px] font-medium uppercase tracking-wider transition-all ${
                  preset === opt.value
                    ? "bg-ink text-white"
                    : "text-ash hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex gap-2">
              <Input
                type="date"
                value={dates.startDate}
                onChange={(e) => setDates((p) => ({ ...p, startDate: e.target.value }))}
              />
              <Input
                type="date"
                value={dates.endDate}
                onChange={(e) => setDates((p) => ({ ...p, endDate: e.target.value }))}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-4 py-3">
            <AlertCircle size={14} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center text-ash py-20 text-sm">Loading reports...</div>
        ) : (
          <>
            {/* Revenue Hero + Stats */}
            {overview && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Revenue — large card */}
                <div className="lg:col-span-1 bg-ink text-white rounded-2xl p-6 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
                      Total Revenue
                    </p>
                    <p className="font-display text-4xl font-light">
                      {formatPrice(overview.revenue.total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                    <p className="text-[11px] text-white/50">
                      {overview.appointments.completionRate} completion rate
                    </p>
                  </div>
                </div>

                {/* Other stats */}
                <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    {
                      label: "Bookings",
                      value: overview.appointments.total,
                      icon: <CalendarDays size={13} />,
                      color: "text-ink",
                    },
                    {
                      label: "Completed",
                      value: overview.appointments.completed,
                      icon: <CheckCircle size={13} />,
                      color: "text-emerald-600",
                    },
                    {
                      label: "Cancelled",
                      value: overview.appointments.cancelled,
                      icon: <XCircle size={13} />,
                      color: "text-red-500",
                    },
                    {
                      label: "Pending",
                      value: overview.appointments.pending + overview.appointments.confirmed,
                      icon: <TrendingUp size={13} />,
                      color: "text-amber-600",
                    },
                    {
                      label: "No Shows",
                      value: overview.appointments.noShow,
                      icon: <Users size={13} />,
                      color: "text-ash",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white border border-smoke rounded-2xl p-4 flex flex-col justify-between"
                    >
                      <div className={`${stat.color} mb-3`}>{stat.icon}</div>
                      <div>
                        <p className="text-2xl font-semibold">{stat.value}</p>
                        <p className="text-[10px] text-ash uppercase tracking-wider mt-0.5">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Daily Revenue Chart — 2 cols */}
              <div className="xl:col-span-2 bg-white border border-smoke rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-semibold">Daily Activity</h3>
                    <p className="text-[11px] text-ash mt-0.5">Revenue & bookings per day</p>
                  </div>
                </div>

                {dailyBookings.length === 0 ? (
  <p className="text-sm text-ash py-12 text-center">No activity in this period.</p>
) : dailyBookings.length <= 3 ? (
  /* List view for few data points */
  <div className="space-y-3">
    {dailyBookings.map((d) => (
      <div key={d.date} className="flex items-center gap-4">
        <span className="text-xs font-medium w-16 shrink-0">
          {formatDateShort(d.date)}
        </span>
        <div className="flex-1 h-8 bg-smoke/40 rounded-lg overflow-hidden relative">
          <div
            className="h-full bg-ink rounded-lg transition-all"
            style={{ width: `${Math.max((d.revenue / maxRevenue) * 100, 8)}%` }}
          />
          <span className="absolute inset-0 flex items-center px-3 text-[11px] font-medium">
            <span className={d.revenue / maxRevenue > 0.3 ? "text-white" : "text-ink"}>
              {d.total} bookings · {formatPrice(d.revenue)}
            </span>
          </span>
        </div>
      </div>
    ))}
  </div>
) : (
  /* Bar chart for many data points */
  <div className="relative">
    <div className="flex items-end gap-1.5 h-48">
      {dailyBookings.map((d) => {
        const height = Math.max((d.revenue / maxRevenue) * 100, 6);
        return (
          <div
            key={d.date}
            className="flex-1 flex flex-col items-center group relative"
          >
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-ink text-white text-[10px] px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                <p className="font-medium">{formatDateShort(d.date)}</p>
                <p className="text-white/60 mt-0.5">
                  {d.total} bookings · {formatPrice(d.revenue)}
                </p>
                <p className="text-white/40">
                  {d.completed} done · {d.cancelled} cancelled
                </p>
              </div>
            </div>
            <div
              className="w-full bg-ink/90 rounded-t-md hover:bg-gold transition-colors cursor-pointer"
              style={{ height: `${height}%` }}
            />
          </div>
        );
      })}
    </div>
    <div className="flex gap-1.5 mt-2">
      {dailyBookings.map((d) => (
        <div key={d.date} className="flex-1 text-center">
          <span className="text-[9px] text-ash">
            {formatDateShort(d.date).split(" ")[0]}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
              </div>

              {/* Popular Services — 1 col */}
              <div className="bg-white border border-smoke rounded-2xl p-6">
                <div className="mb-6">
                  <h3 className="text-sm font-semibold">Top Services</h3>
                  <p className="text-[11px] text-ash mt-0.5">By revenue</p>
                </div>

                {popularServices.length === 0 ? (
                  <p className="text-sm text-ash py-12 text-center">No data yet.</p>
                ) : (
                  <div className="space-y-4">
                    {popularServices.map((s, i) => {
                      const maxRev = popularServices[0]?.totalRevenue || 1;
                      const width = Math.max((s.totalRevenue / maxRev) * 100, 8);
                      return (
                        <div key={s.serviceId}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: CATEGORY_COLORS[s.category] || CATEGORY_COLORS.other,
                                }}
                              />
                              <span className="text-xs font-medium">{s.name}</span>
                            </div>
                            <span className="text-xs font-semibold">{formatPrice(s.totalRevenue)}</span>
                          </div>
                          <div className="h-1.5 bg-smoke rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${width}%`,
                                backgroundColor: CATEGORY_COLORS[s.category] || CATEGORY_COLORS.other,
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-ash mt-1">
                            {s.totalBookings} booking{s.totalBookings !== 1 ? "s" : ""}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Staff Performance */}
            <div className="bg-white border border-smoke rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-smoke">
                <h3 className="text-sm font-semibold">Staff Performance</h3>
                <p className="text-[11px] text-ash mt-0.5">Individual metrics for the selected period</p>
              </div>

              {staffPerf.length === 0 ? (
                <p className="text-sm text-ash py-12 text-center">No staff data.</p>
              ) : (
                <div className="divide-y divide-smoke/60">
                  {staffPerf.map((s) => {
                    const maxRev = Math.max(...staffPerf.map((sp) => sp.totalRevenue), 1);
                    return (
                      <div
                        key={s.staffId}
                        className="px-6 py-4 flex items-center gap-5 hover:bg-smoke/20 transition-colors"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-smoke text-ink flex items-center justify-center text-xs font-semibold shrink-0">
                          {getInitials(s.name)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-[11px] text-ash">{s.email}</p>
                        </div>

                        {/* Appointments */}
                        <div className="text-center px-4">
                          <p className="text-lg font-semibold">{s.totalAppointments}</p>
                          <p className="text-[9px] text-ash uppercase tracking-wider">Appts</p>
                        </div>

                        {/* Revenue bar */}
                        <div className="w-32 hidden md:block">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{formatPrice(s.totalRevenue)}</span>
                          </div>
                          <div className="h-1.5 bg-smoke rounded-full overflow-hidden">
                            <div
                              className="h-full bg-ink rounded-full"
                              style={{
                                width: `${Math.max((s.totalRevenue / maxRev) * 100, 8)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="text-right shrink-0 w-20">
                          {typeof s.avgRating === "number" ? (
                            <div className="flex items-center justify-end gap-1">
                              <Star size={12} className="text-gold fill-gold" />
                              <span className="text-sm font-medium">{s.avgRating}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-ash">No ratings</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}