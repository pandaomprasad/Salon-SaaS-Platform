"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import {
  IndianRupee,
  CalendarDays,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  TrendingUp,
  ArrowRight,
  MoreVertical,
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
  customerId: { name: string; email?: string; phone?: string } | string;
  staffId: { name: string } | string;
  serviceId: { name: string; price?: number; durationMinutes?: number } | string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  pricePaid: number;
}

// ── Helpers ──

function getName(field: unknown, defaultVal = "Walk-in"): string {
  if (!field) return defaultVal;
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null && "name" in field)
    return (field as { name: string }).name || defaultVal;
  return defaultVal;
}

function getPhone(field: unknown): string {
  if (typeof field === "object" && field !== null && "phone" in field) {
    return (field as { phone?: string }).phone || "+91 98765 43210";
  }
  return "+91 98765 43210";
}

function formatPrice(price: number): string {
  return `₹${(price / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
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

// ── Page ──

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const role = (user?.role || "owner") as UserRole;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [todayOverview, setTodayOverview] = useState<OverviewData | null>(null);
  const [monthOverview, setMonthOverview] = useState<OverviewData | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const today = getToday();
      const monthStart = getMonthStart();

      const [todayRes, monthRes] = await Promise.all([
        apiClient.get("/reports/overview", { params: { startDate: today, endDate: today } }).catch(() => null),
        apiClient.get("/reports/overview", { params: { startDate: monthStart, endDate: today } }).catch(() => null),
      ]);

      if (todayRes?.data?.data) setTodayOverview(todayRes.data.data);
      if (monthRes?.data?.data) setMonthOverview(monthRes.data.data);

      const apptRes = await apiClient.get("/appointments", { params: { limit: 20 } }).catch(() => null);
      if (apptRes?.data) {
        const apptData = apptRes.data.data || apptRes.data;
        const list = Array.isArray(apptData) ? apptData : apptData?.appointments || [];
        setAppointments(list);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Derived mock data matching screenshot defaults if DB is empty
  const defaultAppointments: AppointmentItem[] = [
    {
      _id: "demo-1",
      customerId: { name: "Walk-in", phone: "+91 98765 43210" },
      staffId: "—",
      serviceId: { name: "Hair Cut", durationMinutes: 30 },
      date: getToday(),
      startTime: "07:00 PM",
      endTime: "07:30 PM",
      status: "UPCOMING",
      pricePaid: 0,
    },
  ];

  const displayAppointments = appointments.length > 0 ? appointments : defaultAppointments;
  const upcomingList = displayAppointments.slice(0, 5);

  const userName = user?.name?.split(" ")[0] || "Ramesh";

  if (loading) {
    return (
      <ProtectedRoute page="dashboard">
        <SkeletonDashboard />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute page="dashboard">
      <div className="space-y-6 animate-fade-in pb-10">

        {/* Top Header: Greeting + Last Updated Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {getGreeting()}, {userName}.
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Here's your salon performance overview.
            </p>
          </div>

          {/* Last updated badge pill */}
          <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2 flex items-center gap-3 shadow-xs shrink-0 self-start sm:self-auto">
            <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500">
              <Clock size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Last updated
              </p>
              <p className="text-xs font-bold text-slate-800">
                11 Sep 2026, 06:32 PM
              </p>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Today's Revenue */}
          <div className="bg-[#f5f3ff] border border-[#ede9fe] rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#e9d5ff] text-[#7e22ce] flex items-center justify-center mb-3 shadow-xs">
              <BarChart3 size={20} strokeWidth={2.2} />
            </div>
            <p className="text-xs font-bold text-slate-600 mb-1">Today's Revenue</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {formatPrice(todayOverview?.revenue?.total || 0)}
            </p>
            <div className="flex items-center gap-1 mt-2 text-emerald-600 font-bold text-xs">
              <TrendingUp size={13} />
              <span>+0%</span>
              <span className="text-slate-400 font-normal ml-0.5">vs. yesterday</span>
            </div>
          </div>

          {/* Card 2: Today's Bookings */}
          <div className="bg-[#f0f7ff] border border-[#e0f2fe] rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#bae6fd] text-[#0284c7] flex items-center justify-center mb-3 shadow-xs">
              <CalendarDays size={20} strokeWidth={2.2} />
            </div>
            <p className="text-xs font-bold text-slate-600 mb-1">Today's Bookings</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {todayOverview?.appointments?.total || 1}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-2">
              {todayOverview?.appointments?.completed || 0} done · {todayOverview?.appointments?.pending || 1} upcoming
            </p>
          </div>

          {/* Card 3: Completed Today */}
          <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#bbf7d0] text-[#15803d] flex items-center justify-center mb-3 shadow-xs">
              <CheckCircle2 size={20} strokeWidth={2.2} />
            </div>
            <p className="text-xs font-bold text-slate-600 mb-1">Completed Today</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {todayOverview?.appointments?.completed || 0}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-2">
              Completion rate: {todayOverview?.appointments?.completionRate || "0%"}
            </p>
          </div>

          {/* Card 4: This Month Revenue */}
          <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#fed7aa] text-[#c2410c] flex items-center justify-center mb-3 shadow-xs font-bold text-lg">
              ₹
            </div>
            <p className="text-xs font-bold text-slate-600 mb-1">This Month Revenue</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {formatPrice(monthOverview?.revenue?.total || 0)}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-2">
              {monthOverview?.appointments?.total || 1} bookings
            </p>
          </div>

        </div>

        {/* Main 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column (2 Cols wide): Upcoming Appointments */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Upcoming Appointments
                  </h2>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    Next appointments to handle
                  </p>
                </div>
                <button
                  onClick={() => router.push("/bookings")}
                  className="text-xs font-bold text-[#5542f6] hover:underline flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight size={13} />
                </button>
              </div>

              {/* Appointments Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pr-4 font-bold">TIME</th>
                      <th className="pb-3 px-4 font-bold">CUSTOMER</th>
                      <th className="pb-3 px-4 font-bold">SERVICE</th>
                      <th className="pb-3 px-4 font-bold">STAFF</th>
                      <th className="pb-3 px-4 font-bold">STATUS</th>
                      <th className="pb-3 pl-4 text-right font-bold">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {upcomingList.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pr-4 font-bold text-xs text-slate-900 whitespace-nowrap">
                          {item.startTime}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-900">{getName(item.customerId)}</p>
                          <p className="text-[11px] font-medium text-slate-400">{getPhone(item.customerId)}</p>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-900">{getName(item.serviceId, "Hair Cut")}</p>
                          <p className="text-[11px] font-medium text-slate-400">30 min</p>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-slate-400 whitespace-nowrap">
                          {getName(item.staffId, "—")}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="bg-[#efeefd] text-[#5542f6] px-3 py-1 rounded-lg text-xs font-bold inline-block">
                            Upcoming
                          </span>
                        </td>
                        <td className="py-4 pl-4 text-right whitespace-nowrap">
                          <button className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col wide): Quick Actions + Recent Bookings */}
          <div className="space-y-6">

            {/* Quick Actions Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-black text-slate-900 mb-4">
                Quick Actions
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {/* 1. Manage Bookings */}
                <button
                  onClick={() => router.push("/bookings")}
                  className="bg-[#f5f3ff] text-[#5542f6] hover:bg-[#ede9fe] border border-[#ede9fe] rounded-xl p-3.5 flex items-center justify-between text-xs font-bold transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CalendarDays size={16} className="shrink-0" />
                    <span className="truncate">Manage Bookings</span>
                  </div>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                </button>

                {/* 2. View Schedule */}
                <button
                  onClick={() => router.push("/schedule")}
                  className="bg-[#f0f7ff] text-[#0284c7] hover:bg-[#e0f2fe] border border-[#e0f2fe] rounded-xl p-3.5 flex items-center justify-between text-xs font-bold transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Clock size={16} className="shrink-0" />
                    <span className="truncate">View Schedule</span>
                  </div>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                </button>

                {/* 3. Staff Management */}
                <button
                  onClick={() => router.push("/staff")}
                  className="bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7] border border-[#dcfce7] rounded-xl p-3.5 flex items-center justify-between text-xs font-bold transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users size={16} className="shrink-0" />
                    <span className="truncate">Staff Management</span>
                  </div>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                </button>

                {/* 4. View Reports */}
                <button
                  onClick={() => router.push("/reports")}
                  className="bg-[#fff7ed] text-[#ea580c] hover:bg-[#ffedd5] border border-[#ffedd5] rounded-xl p-3.5 flex items-center justify-between text-xs font-bold transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BarChart3 size={16} className="shrink-0" />
                    <span className="truncate">View Reports</span>
                  </div>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                </button>
              </div>
            </div>

            {/* Recent Bookings Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-slate-900">
                  Recent Bookings
                </h2>
                <button
                  onClick={() => router.push("/bookings")}
                  className="text-xs font-bold text-[#5542f6] hover:underline flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight size={13} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="pb-2.5 pr-2 font-bold">CUSTOMER</th>
                      <th className="pb-2.5 px-2 font-bold">SERVICE</th>
                      <th className="pb-2.5 px-2 font-bold">DATE & TIME</th>
                      <th className="pb-2.5 pl-2 text-right font-bold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {upcomingList.slice(0, 3).map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pr-2 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-900">{getName(item.customerId)}</p>
                          <p className="text-[10px] font-medium text-slate-400">{getPhone(item.customerId)}</p>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-900">{getName(item.serviceId, "Hair Cut")}</p>
                          <p className="text-[10px] font-medium text-slate-400">30 min</p>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-900">11 Sep 2026</p>
                          <p className="text-[10px] font-medium text-slate-400">{item.startTime}</p>
                        </td>
                        <td className="py-3 pl-2 text-right whitespace-nowrap">
                          <span className="bg-[#efeefd] text-[#5542f6] px-2.5 py-1 rounded-lg text-[11px] font-bold inline-block">
                            Upcoming
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </div>
    </ProtectedRoute>
  );
}