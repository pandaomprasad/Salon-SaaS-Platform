"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Building2,
  GitBranch,
  UserCog,
  Users,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Layers,
} from "lucide-react";

interface Stats {
  totalRevenue?: number;
  salons?: { total: number; active: number; deactivated?: number };
  branches?: { total: number };
  owners?: { total: number };
  staff?: { total: number };
  customers?: { total: number };
  appointments?: { total: number; completed: number; today?: number };
  pendingOwnerRequests?: number;
  totalSalons?: number;
  activeSalons?: number;
  totalBranches?: number;
  totalOwners?: number;
  totalStaff?: number;
  totalCustomers?: number;
  totalAppointments?: number;
  completedAppointments?: number;
  todayAppointments?: number;
}

interface GrowthItem {
  month: string;
  newSalons: number;
  newCustomers: number;
  newAppointments: number;
}

interface ActivityItem {
  id?: string;
  _id?: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [growth, setGrowth] = useState<GrowthItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [sRes, gRes, aRes] = await Promise.all([
        apiClient.get("/admin/stats"),
        apiClient.get("/admin/growth").catch(() => ({ data: { data: { growth: [] } } })),
        apiClient.get("/admin/activity").catch(() => ({ data: { data: [] } })),
      ]);

      const rawAct = aRes.data?.data;
      const actList = Array.isArray(rawAct) ? rawAct : (Array.isArray(rawAct?.activities) ? rawAct.activities : []);

      setStats(sRes.data?.data || null);
      setGrowth(gRes.data?.data?.growth || []);
      setActivity(actList);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setActivity([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in p-1">
        <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl">
          <div className="space-y-1">
            <div className="animate-pulse bg-slate-700 rounded h-6 w-48" />
            <div className="animate-pulse bg-slate-800 rounded h-3 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs space-y-2">
              <div className="animate-pulse bg-slate-200 rounded-lg w-8 h-8" />
              <div className="animate-pulse bg-slate-200 rounded h-6 w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-4 h-64" />
          <div className="bg-white border border-slate-100 rounded-2xl p-4 h-64" />
        </div>
      </div>
    );
  }

  // Safe normalized numbers
  const totalSalons = stats?.salons?.total ?? stats?.totalSalons ?? 0;
  const activeSalons = stats?.salons?.active ?? stats?.activeSalons ?? 0;
  const totalBranches = stats?.branches?.total ?? stats?.totalBranches ?? 0;
  const totalOwners = stats?.owners?.total ?? stats?.totalOwners ?? 0;
  const totalStaff = stats?.staff?.total ?? stats?.totalStaff ?? 0;
  const totalCustomers = stats?.customers?.total ?? stats?.totalCustomers ?? 0;
  const totalAppts = stats?.appointments?.total ?? stats?.totalAppointments ?? 0;
  const completedAppts = stats?.appointments?.completed ?? stats?.completedAppointments ?? 0;
  const pendingRequests = stats?.pendingOwnerRequests ?? 0;
  const revenue = stats?.totalRevenue ?? 0;

  const maxAppts = Math.max(...growth.map((g) => g.newAppointments), 1);

  return (
    <div className="space-y-4 animate-fade-in max-w-[1600px] mx-auto pb-4">
      {/* Clean Top Header (No dark banner box, Refresh button retained) */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Platform Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time metrics across all salons • {currentDate}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin text-indigo-600" : "text-indigo-600"} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Pending Approval Banner (Compact) */}
      {pendingRequests > 0 && (
        <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p className="text-xs font-bold text-amber-900">
              {pendingRequests} Owner Request{pendingRequests > 1 ? "s" : ""} Pending Review
            </p>
          </div>
          <a
            href="#owners"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition-all shrink-0 cursor-pointer"
          >
            <span>Review</span>
            <ArrowUpRight size={12} />
          </a>
        </div>
      )}

      {/* Compact 6-Card Single-Row Metric Grid (Fits comfortably!) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-indigo-600" />
            <span>Key Metrics</span>
          </h2>
          <span className="text-[11px] text-slate-400">Updated just now</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Platform Revenue */}
          <MetricCard
            title="Revenue"
            value={formatCurrency(revenue)}
            subtext="Gross earnings"
            icon={<TrendingUp size={16} className="text-emerald-600" />}
            iconBg="bg-emerald-500/10 border-emerald-500/20"
            badge="+14%"
            badgeType="success"
          />

          {/* Card 2: Salons Network */}
          <MetricCard
            title="Salons"
            value={formatNumber(totalSalons)}
            subtext={`${activeSalons} active`}
            icon={<Building2 size={16} className="text-blue-600" />}
            iconBg="bg-blue-500/10 border-blue-500/20"
            badge={`${Math.round((activeSalons / Math.max(totalSalons, 1)) * 100)}%`}
            badgeType="info"
          />

          {/* Card 3: Branches Total */}
          <MetricCard
            title="Branches"
            value={formatNumber(totalBranches)}
            subtext="Locations"
            icon={<GitBranch size={16} className="text-purple-600" />}
            iconBg="bg-purple-500/10 border-purple-500/20"
            badge="Online"
            badgeType="neutral"
          />

          {/* Card 4: Salon Owners */}
          <MetricCard
            title="Owners"
            value={formatNumber(totalOwners)}
            subtext="Business accounts"
            icon={<UserCog size={16} className="text-amber-600" />}
            iconBg="bg-amber-500/10 border-amber-500/20"
            badge="Verified"
            badgeType="warning"
          />

          {/* Card 5: Stylists & Staff */}
          <MetricCard
            title="Staff"
            value={formatNumber(totalStaff)}
            subtext="Active team"
            icon={<Users size={16} className="text-teal-600" />}
            iconBg="bg-teal-500/10 border-teal-500/20"
            badge="Active"
            badgeType="info"
          />

          {/* Card 6: Appointments */}
          <MetricCard
            title="Bookings"
            value={formatNumber(totalAppts)}
            subtext={`${completedAppts} done`}
            icon={<CalendarDays size={16} className="text-indigo-600" />}
            iconBg="bg-indigo-500/10 border-indigo-500/20"
            badge={`${completedAppts} Done`}
            badgeType="indigo"
          />
        </div>
      </div>

      {/* Main Content Split: Growth Chart + Activity Timeline (Fits in Viewport!) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Growth Chart (Spans 2 Columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-row items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Platform Growth Trends</span>
                  <Sparkles size={14} className="text-amber-500" />
                </h2>
                <p className="text-[11px] text-slate-500">
                  Monthly appointment volume (Last 6 Months)
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>Appointments</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Salons</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <span>Customers</span>
                </div>
              </div>
            </div>

            {growth.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-1">
                <CalendarDays size={24} className="mx-auto text-slate-300" />
                <p className="text-xs font-medium">No growth metrics recorded yet.</p>
              </div>
            ) : (
              <div className="relative pt-4 pb-1">
                {/* Y-axis grid lines */}
                <div className="absolute inset-x-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
                  {[1, 0.5, 0].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold text-slate-400 w-6 text-right shrink-0">
                        {Math.round(maxAppts * step)}
                      </span>
                      <div className="flex-1 border-b border-dashed border-slate-100" />
                    </div>
                  ))}
                </div>

                {/* Bars Container */}
                <div className="ml-8 flex items-end gap-2 sm:gap-4 h-36 relative z-10 pt-2">
                  {growth.map((g, i) => {
                    const heightPercent = Math.max((g.newAppointments / maxAppts) * 100, 10);
                    return (
                      <div
                        key={g.month || i}
                        className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                      >
                        {/* Hover Tooltip Card */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-20">
                          <span className="font-bold text-indigo-300">{g.month}: </span>
                          <span>{g.newAppointments} appts • {g.newSalons} salons</span>
                        </div>

                        {/* Top metric badge above bar */}
                        <span className="text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {g.newAppointments}
                        </span>

                        {/* Gradient Bar */}
                        <div className="w-full max-w-[32px] bg-slate-100 rounded-t-lg overflow-hidden h-full flex items-end p-0.5 group-hover:bg-indigo-50 transition-colors">
                          <div
                            className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-cyan-400 rounded-t-md transition-all duration-300 shadow-xs"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>

                        {/* Month Label */}
                        <span className="text-[10px] font-bold text-slate-600 mt-0.5">
                          {g.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 size={12} />
              Aggregated platform analytics synced
            </span>
            <span className="font-medium text-slate-400">Last 6 Months</span>
          </div>
        </div>

        {/* Recent Activity Timeline (Spans 1 Column) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Clock size={16} className="text-indigo-600" />
                <span>Live Activity Stream</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                Real-time
              </span>
            </div>

            {!Array.isArray(activity) || activity.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <ShieldCheck size={24} className="mx-auto text-slate-300" />
                <p className="text-xs font-medium">All platform services normal.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                {(Array.isArray(activity) ? activity : []).slice(0, 5).map((act, i) => (
                  <div
                    key={act.id || act._id || i}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                  >
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-900 truncate">
                        {act.title || act.type}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {act.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 text-center">
            <span className="text-[10px] font-semibold text-slate-400">
              ⚡ Platform Status: 100% Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  iconBg: string;
  badge: string;
  badgeType: "success" | "info" | "warning" | "indigo" | "neutral";
}

function MetricCard({
  title,
  value,
  subtext,
  icon,
  iconBg,
  badge,
  badgeType,
}: MetricCardProps) {
  const badgeStyles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all duration-200 relative overflow-hidden group flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className={`w-8 h-8 rounded-xl ${iconBg} border flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyles[badgeType]}`}>
            {badge}
          </span>
        </div>

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
          {title}
        </p>
        <p className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
          {value}
        </p>
      </div>

      <p className="text-[10px] font-medium text-slate-500 mt-2 pt-1.5 border-t border-slate-100 truncate">
        {subtext}
      </p>
    </div>
  );
}