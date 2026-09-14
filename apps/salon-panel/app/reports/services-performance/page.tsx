"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import apiClient from "@/lib/api-client";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  CalendarCheck,
  Award,
  Calendar,
  ArrowUpDown,
  Scissors,
  Filter,
  BarChart3,
} from "lucide-react";

interface PopularService {
  serviceId: string;
  name: string;
  category: string;
  totalBookings: number;
  totalRevenue: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Hair: "#3b82f6",
  Color: "#8b5cf6",
  Treatment: "#10b981",
  Skin: "#e11d48",
  Nails: "#ec4899",
  Makeup: "#d97706",
  Spa: "#0d9488",
  other: "#64748b",
};

function formatPrice(price: number): string {
  return `₹${(price / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function getPresetDates(preset: string): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();

  if (preset === "today") {
    // start is today
  } else if (preset === "week") {
    start.setDate(end.getDate() - 7);
  } else if (preset === "month") {
    start.setDate(1); // 1st of current month
  } else if (preset === "year") {
    start.setMonth(0, 1); // Jan 1st of current year
  }

  const formatStr = (d: Date) => d.toISOString().split("T")[0];
  return { startDate: formatStr(start), endDate: formatStr(end) };
}

export default function ServicesPerformanceDetailPage() {
  const [preset, setPreset] = useState("month");
  const [dates, setDates] = useState(getPresetDates("month"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [servicesList, setServicesList] = useState<PopularService[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"revenue" | "bookings" | "name">("revenue");

  const fetchServicesPerformance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { startDate: dates.startDate, endDate: dates.endDate };
      const { data } = await apiClient.get("/reports/popular-services", { params });
      const list: PopularService[] = data.data?.popularServices || data.popularServices || [];
      setServicesList(list);
    } catch (err: any) {
      console.error("Failed to load popular services:", err);
      setError("Failed to load service performance analytics");
    } finally {
      setLoading(false);
    }
  }, [dates]);

  useEffect(() => {
    fetchServicesPerformance();
  }, [fetchServicesPerformance]);

  function handlePresetChange(value: string) {
    setPreset(value);
    if (value !== "custom") setDates(getPresetDates(value));
  }

  // Categories extraction
  const categories = Array.from(new Set(servicesList.map((s) => s.category || "Other")));

  // Filter & Sort logic
  const filteredList = servicesList
    .filter((s) => {
      const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || (s.category || "Other").toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "revenue") return (b.totalRevenue || 0) - (a.totalRevenue || 0);
      if (sortBy === "bookings") return (b.totalBookings || 0) - (a.totalBookings || 0);
      return (a.name || "").localeCompare(b.name || "");
    });

  // Calculate Aggregates
  const totalServiceCount = servicesList.length;
  const totalBookings = servicesList.reduce((sum, s) => sum + (s.totalBookings || 0), 0);
  const totalRevenue = servicesList.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);

  const topService = servicesList.length > 0
    ? [...servicesList].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))[0]
    : null;

  return (
    <ProtectedRoute page="reports">
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/reports"
              className="p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-2xs"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Top Services Analytics
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                Detailed service revenue contributions, booking frequencies, and category breakdowns
              </p>
            </div>
          </div>

          <button
            onClick={fetchServicesPerformance}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 rounded-2xl transition-all shadow-xs disabled:opacity-50 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Preset Selector Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "today", label: "Today" },
              { id: "week", label: "This Week" },
              { id: "month", label: "This Month" },
              { id: "year", label: "This Year" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  preset === p.id
                    ? "bg-[#5542f6] text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl">
            <Calendar size={13} className="text-[#5542f6]" />
            <span>
              {dates.startDate} to {dates.endDate}
            </span>
          </div>
        </div>

        {/* Aggregated Key Service Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Services Booked</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Scissors size={18} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{totalServiceCount}</p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">Unique services ordered</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Service Bookings</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CalendarCheck size={18} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{totalBookings}</p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">Total completed appointments</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Services Revenue</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{formatPrice(totalRevenue)}</p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">For selected timeframe</p>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Highest Revenue Service</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award size={18} />
              </div>
            </div>
            <p className="text-base font-black text-slate-900 truncate mt-2">
              {topService ? topService.name : "—"}
            </p>
            <p className="text-[11px] font-bold text-amber-600 mt-0.5">
              {topService ? formatPrice(topService.totalRevenue) : "₹0"}
            </p>
          </div>
        </div>

        {/* Search, Filter & Sorting Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search service by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5542f6]/20 shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200/90 px-3.5 py-2 rounded-2xl shadow-xs">
              <Filter size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 bg-white border border-slate-200/90 px-3.5 py-2 rounded-2xl shadow-xs">
              <ArrowUpDown size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="revenue">Highest Revenue</option>
                <option value="bookings">Most Booked</option>
                <option value="name">Service Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Detailed Service Performance Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-black text-base text-slate-900">Services Performance Table</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Revenue contribution and booking frequency per service
              </p>
            </div>
            <span className="text-xs font-bold text-[#5542f6] bg-[#efeefd] px-3 py-1 rounded-full">
              {filteredList.length} Services
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#5542f6] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400">Loading service analytics...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-16 text-center text-xs font-bold text-slate-400">
              No service performance data found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80">
                    <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 w-12 text-center">
                      #
                    </th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Service Name
                    </th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Category
                    </th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 text-center">
                      Total Bookings
                    </th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 text-center">
                      Avg Revenue / Booking
                    </th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Revenue Share
                    </th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 text-right">
                      Total Revenue (₹)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((s, index) => {
                    const maxRev = servicesList[0]?.totalRevenue || 1;
                    const revenuePct = totalRevenue > 0 ? Math.round((s.totalRevenue / totalRevenue) * 100) : 0;
                    const widthPct = Math.max((s.totalRevenue / maxRev) * 100, 8);
                    const color = CATEGORY_COLORS[s.category] || CATEGORY_COLORS.other;
                    const avgPrice = s.totalBookings > 0 ? Math.round(s.totalRevenue / s.totalBookings) : s.totalRevenue;

                    return (
                      <tr key={s.serviceId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 text-xs font-bold text-slate-400 text-center">
                          {index + 1}
                        </td>

                        {/* Service Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#efeefd] text-[#5542f6] border border-[#5542f6]/20 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              <Sparkles size={16} />
                            </div>
                            <span className="text-xs font-black text-slate-900 capitalize">
                              {s.name}
                            </span>
                          </div>
                        </td>

                        {/* Category Tag */}
                        <td className="py-4 px-5">
                          <span
                            className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize"
                            style={{
                              backgroundColor: `${color}15`,
                              color: color,
                            }}
                          >
                            {s.category || "General"}
                          </span>
                        </td>

                        {/* Total Bookings */}
                        <td className="py-4 px-5 text-xs font-black text-slate-900 text-center">
                          {s.totalBookings}
                        </td>

                        {/* Avg Revenue per booking */}
                        <td className="py-4 px-5 text-xs font-bold text-slate-600 text-center">
                          {formatPrice(avgPrice)}
                        </td>

                        {/* Revenue Share Bar */}
                        <td className="py-4 px-5 w-48">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                              <span>Share</span>
                              <span>{revenuePct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${widthPct}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Total Revenue */}
                        <td className="py-4 px-5 text-xs font-black text-slate-900 text-right">
                          {formatPrice(s.totalRevenue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
