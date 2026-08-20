"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/ui/Badge";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import {
  IndianRupee,
  CalendarDays,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
  Scissors,
  Star,
  AlertCircle,
} from "lucide-react";
import type { UserRole } from "@/lib/api";
import { SkeletonDashboard } from "@/components/ui/Skeleton";

// ── Types ──

interface OverviewData {
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

interface AppointmentItem {
  _id: string;
  customerId: { name: string; email?: string } | string;
  staffId: { name: string } | string;
  serviceId: { name: string; price?: number; durationMinutes?: number } | string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  pricePaid: number;
}

interface StaffPerfItem {
  staffId: string;
  name: string;
  totalAppointments: number;
  totalRevenue: number;
  avgRating: string | number;
}

interface PopularServiceItem {
  name: string;
  category: string;
  totalBookings: number;
  totalRevenue: number;
}

// ── Helpers ──

function getName(field: unknown): string {
  if (!field) return "—";
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null && "name" in field)
    return (field as { name: string }).name;
  return "—";
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function formatPrice(price: number): string {
  return `₹${(price / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

import { toLocalDateStr } from "@/lib/utils";

function getToday(): string {
  return toLocalDateStr();
}

function getMonthStart(): string {
  return getToday().substring(0, 8) + "01";
}

function formatDateNice(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  hair: "bg-purple-100 text-purple-700",
  skin: "bg-rose-100 text-rose-700",
  nails: "bg-pink-100 text-pink-700",
  makeup: "bg-amber-100 text-amber-700",
  spa: "bg-teal-100 text-teal-700",
  other: "bg-gray-100 text-gray-600",
};

// ── Page ──

export default function DashboardPage() {
  const { user, salon } = useSelector((state: RootState) => state.auth);
  const role = (user?.role || "staff") as UserRole;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [todayOverview, setTodayOverview] = useState<OverviewData | null>(null);
  const [monthOverview, setMonthOverview] = useState<OverviewData | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [staffPerf, setStaffPerf] = useState<StaffPerfItem[]>([]);
  const [popularServices, setPopularServices] = useState<PopularServiceItem[]>([]);

  const fetchDashboard = useCallback(async () => {
  setLoading(true);
  try {
    const today = getToday();
    const monthStart = getMonthStart();

    // Priority 1 — load stats first (fast, small response)
    const [todayRes, monthRes] = await Promise.all([
      apiClient.get("/reports/overview", { params: { startDate: today, endDate: today } }),
      apiClient.get("/reports/overview", { params: { startDate: monthStart, endDate: today } }),
    ]);
    setTodayOverview(todayRes.data.data);
    setMonthOverview(monthRes.data.data);
    setLoading(false); // Show stats immediately

    // Priority 2 — load details in background (don't block UI)
    const bgRequests: Promise<any>[] = [
      apiClient.get("/appointments", { params: { limit: 50 } }),
    ];

    if (role === "owner" || role === "manager") {
      bgRequests.push(
        apiClient.get("/reports/staff-performance", {
          params: { startDate: monthStart, endDate: today },
        }),
        apiClient.get("/reports/popular-services", {
          params: { startDate: monthStart, endDate: today },
        }),
      );
    }

    const bgResults = await Promise.all(bgRequests);

    const apptData = bgResults[0].data.data as any;
    const apptList = Array.isArray(apptData) ? apptData : apptData?.appointments || [];
    setAppointments(apptList);

    if (bgResults[1]) setStaffPerf(bgResults[1].data.data?.staffPerformance || []);
    if (bgResults[2]) setPopularServices(bgResults[2].data.data?.popularServices || []);
  } catch {
    setLoading(false);
  }
}, [role]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Derived data
  const today = getToday();
  const todayAppointments = appointments.filter((a) => a.date === today);
  const upcomingAppointments = appointments
    .filter((a) => a.date >= today && ["PENDING", "CONFIRMED"].includes(a.status))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date > b.date ? 1 : -1;
      return a.startTime > b.startTime ? 1 : -1;
    })
    .slice(0, 5);
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;

  if (loading) {
  return (
    <ProtectedRoute page="dashboard">
      <SkeletonDashboard />
    </ProtectedRoute>
  );
}

  return (
    <ProtectedRoute page="dashboard">
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <p className="text-[11px] tracking-[0.15em] uppercase text-ash/70 mb-2">
            {formatDateNice(today)}
          </p>
          <h2 className="font-display text-4xl text-ink leading-tight">
            {getGreeting()}, {user?.name?.split(" ")[0] || "there"}.
          </h2>
          <div className="w-8 h-px bg-gold mt-3" />
        </div>

        {/* Pending Alert */}
        {pendingCount > 0 && (role === "owner" || role === "manager") && (
          <div
            onClick={() => router.push("/bookings")}
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 cursor-pointer hover:bg-amber-100 transition-colors"
          >
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{pendingCount} booking{pendingCount !== 1 ? "s" : ""}</span> awaiting confirmation
            </p>
            <ArrowRight size={14} className="text-amber-400 ml-auto" />
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Revenue Card — hero */}
          <div className="bg-ink text-white rounded-2xl p-6 flex flex-col justify-between min-h-[150px]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
                {role === "staff" ? "Today's Bookings" : "This Month Revenue"}
              </p>
              <p className="font-display text-4xl font-light">
                {role === "staff"
                  ? todayAppointments.length
                  : formatPrice(monthOverview?.revenue?.total || 0)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              <p className="text-[11px] text-white/50">
                {role === "staff"
                  ? `${todayAppointments.filter((a) => a.status === "COMPLETED").length} completed today`
                  : `${monthOverview?.appointments?.completionRate || "0%"} completion rate`}
              </p>
            </div>
          </div>

          {/* Other stats */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard
              icon={<CalendarDays size={14} />}
              label="Today"
              value={todayOverview?.appointments?.total || 0}
              sub={`${todayOverview?.appointments?.completed || 0} done`}
            />
            <StatCard
              icon={<CheckCircle size={14} />}
              label="This Month"
              value={monthOverview?.appointments?.total || 0}
              sub={`${monthOverview?.appointments?.completed || 0} completed`}
              color="text-emerald-600"
            />
            {role === "staff" ? (
              <StatCard
                icon={<Clock size={14} />}
                label="Upcoming"
                value={upcomingAppointments.length}
                sub="confirmed & pending"
              />
            ) : (
              <StatCard
                icon={<IndianRupee size={14} />}
                label="Today Revenue"
                value={formatPrice(todayOverview?.revenue?.total || 0)}
                sub={`${todayOverview?.appointments?.total || 0} bookings`}
                color="text-gold"
              />
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Upcoming Appointments — 2 cols */}
          <div className="xl:col-span-2 bg-white border border-smoke rounded-2xl">
            <div className="px-6 py-4 border-b border-smoke flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Upcoming Appointments</h3>
                <p className="text-[11px] text-ash mt-0.5">Next appointments to handle</p>
              </div>
              <button
                onClick={() => router.push("/bookings")}
                className="text-[11px] font-medium text-gold hover:text-gold/80 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="px-6 py-12 text-center text-ash text-sm">
                No upcoming appointments.
              </div>
            ) : (
              <div className="divide-y divide-smoke/60">
                {upcomingAppointments.map((a) => (
                  <div
                    key={a._id}
                    onClick={() => router.push("/bookings")}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-smoke/20 transition-colors cursor-pointer"
                  >
                    {/* Time block */}
                    <div className="w-14 text-center shrink-0">
                      <p className="text-sm font-semibold">{a.startTime}</p>
                      <p className="text-[10px] text-ash">
                        {new Date(a.date + "T00:00:00").toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>

                    <div className="w-px h-10 bg-smoke shrink-0" />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getName(a.customerId)}</p>
                      <p className="text-[11px] text-ash truncate">
                        {getName(a.serviceId)} · {getName(a.staffId)}
                      </p>
                    </div>

                    {/* Price + Status */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{formatPrice(a.pricePaid || 0)}</p>
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white border border-smoke rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  ...(role !== "staff"
                    ? [
                        { label: "Manage Bookings", href: "/bookings", icon: <CalendarDays size={13} /> },
                        { label: "View Schedule", href: "/schedule", icon: <Clock size={13} /> },
                        { label: "Staff Management", href: "/staff", icon: <Users size={13} /> },
                        { label: "View Reports", href: "/reports", icon: <TrendingUp size={13} /> },
                      ]
                    : [
                        { label: "My Schedule", href: "/schedule", icon: <Clock size={13} /> },
                        { label: "My Bookings", href: "/bookings", icon: <CalendarDays size={13} /> },
                      ]),
                ].map((action) => (
                  <button
                    key={action.href}
                    onClick={() => router.push(action.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-ash hover:text-ink hover:bg-smoke/50 transition-all text-left"
                  >
                    {action.icon}
                    <span className="flex-1">{action.label}</span>
                    <ArrowRight size={12} className="text-silver" />
                  </button>
                ))}
              </div>
            </div>

            {/* Top Services — owner/manager only */}
            {(role === "owner" || role === "manager") && popularServices.length > 0 && (
              <div className="bg-white border border-smoke rounded-2xl p-5">
                <h3 className="text-sm font-semibold mb-4">Top Services</h3>
                <div className="space-y-3">
                  {popularServices.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          CATEGORY_COLORS[s.category] || CATEGORY_COLORS.other
                        }`}
                      >
                        {s.category}
                      </span>
                      <span className="text-xs font-medium flex-1 truncate">{s.name}</span>
                      <span className="text-xs font-semibold">{formatPrice(s.totalRevenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Staff Performance — owner/manager only */}
        {(role === "owner" || role === "manager") && staffPerf.length > 0 && (
          <div className="bg-white border border-smoke rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-smoke flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Staff Performance</h3>
                <p className="text-[11px] text-ash mt-0.5">This month</p>
              </div>
              <button
                onClick={() => router.push("/reports")}
                className="text-[11px] font-medium text-gold hover:text-gold/80 flex items-center gap-1 transition-colors"
              >
                Full report <ArrowRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-smoke/60">
              {staffPerf.slice(0, 5).map((s) => (
                <div key={s.staffId} className="px-6 py-3.5 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-smoke text-ink flex items-center justify-center text-[10px] font-semibold shrink-0">
                    {getInitials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-[10px] text-ash">{s.totalAppointments} appointments</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatPrice(s.totalRevenue)}</p>
                    {typeof s.avgRating === "number" ? (
                      <span className="flex items-center justify-end gap-0.5 text-[11px] text-gold">
                        <Star size={10} className="fill-gold" />
                        {s.avgRating}
                      </span>
                    ) : (
                      <span className="text-[10px] text-ash">No ratings</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

// ── Stat Card ──

function StatCard({
  icon,
  label,
  value,
  sub,
  color = "text-ink",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color?: string;
}) {
  return (
    <div className="bg-white border border-smoke rounded-2xl p-4">
      <div className={`mb-3 ${color}`}>{icon}</div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-[10px] text-ash uppercase tracking-wider mt-0.5">{label}</p>
      <p className="text-[11px] text-ash mt-1">{sub}</p>
    </div>
  );
}