"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import apiClient from "@/lib/api-client";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  CalendarDays,
  IndianRupee,
  X,
  Star,
  Users,
  TrendingUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserCheck,
  Building2,
  Clock,
  SlidersHorizontal,
} from "lucide-react";

// ── Types ──

interface CustomerData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  completedVisits: number;
  totalSpent: number;
  lastVisit: string | null;
  avgRating: number | null;
  appointments: AppointmentSummary[];
}

interface AppointmentSummary {
  _id: string;
  date: string;
  startTime: string;
  serviceName: string;
  staffName: string;
  status: string;
  price: number;
  rating?: number;
}

// ── Helpers ──

function getInitials(name: string): string {
  if (!name) return "CU";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-amber-50 border-amber-200/80", text: "text-amber-700", label: "Pending" },
  CONFIRMED: { bg: "bg-blue-50 border-blue-200/80", text: "text-blue-700", label: "Confirmed" },
  IN_PROGRESS: { bg: "bg-purple-50 border-purple-200/80", text: "text-purple-700", label: "In Progress" },
  COMPLETED: { bg: "bg-emerald-50 border-emerald-200/80", text: "text-emerald-700", label: "Completed" },
  CANCELLED: { bg: "bg-rose-50 border-rose-200/80", text: "text-rose-600", label: "Cancelled" },
  NO_SHOW: { bg: "bg-slate-100 border-slate-200/80", text: "text-slate-500", label: "No Show" },
};

// ── Extract customers from appointments ──

function extractCustomers(appointments: any[]): CustomerData[] {
  const map: Record<string, CustomerData> = {};

  appointments.forEach((a) => {
    const customer = a.customerId;
    if (!customer || typeof customer !== "object") return;

    const id = customer._id;

    if (!map[id]) {
      map[id] = {
        _id: id,
        name: customer.name || "Customer",
        email: customer.email || "",
        phone: customer.phone || "",
        totalVisits: 0,
        completedVisits: 0,
        totalSpent: 0,
        lastVisit: null,
        avgRating: null,
        appointments: [],
      };
    }

    const c = map[id];
    c.totalVisits++;

    if (a.status === "COMPLETED" || a.status === "completed") {
      c.completedVisits++;
      c.totalSpent += a.pricePaid || a.serviceId?.price || 0;
    }

    if (!c.lastVisit || a.date > c.lastVisit) {
      c.lastVisit = a.date;
    }

    const rating = a.rating?.score || null;

    c.appointments.push({
      _id: a._id,
      date: a.date || "—",
      startTime: a.startTime || "—",
      serviceName: a.serviceId?.name || "Service",
      staffName: a.staffId?.name || "Staff",
      status: (a.status || "CONFIRMED").toUpperCase(),
      price: a.pricePaid || a.serviceId?.price || 0,
      rating: rating,
    });
  });

  // Calculate avg rating
  Object.values(map).forEach((c) => {
    const ratings = c.appointments.filter((a) => a.rating).map((a) => a.rating!);
    if (ratings.length > 0) {
      c.avgRating = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
    }
    c.appointments.sort((a, b) => (b.date > a.date ? 1 : -1));
  });

  return Object.values(map).sort((a, b) => b.totalVisits - a.totalVisits);
}

// ── Page ──

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("visits");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get("/appointments", {
        params: { limit: 500 },
      });
      const appointments = (data.data as any)?.appointments || data.data || [];
      const list = Array.isArray(appointments) ? appointments : [];
      setCustomers(extractCustomers(list));
    } catch {
      setError("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Reset page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);

  // Filter + sort
  const filtered = customers
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "visits") return b.totalVisits - a.totalVisits;
      if (sortBy === "spent") return b.totalSpent - a.totalSpent;
      if (sortBy === "recent") return (b.lastVisit || "") > (a.lastVisit || "") ? 1 : -1;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  // Calculate Metrics
  const totalCustomers = customers.length;
  const totalVisits = customers.reduce((acc, c) => acc + c.totalVisits, 0);
  const completedServices = customers.reduce((acc, c) => acc + c.completedVisits, 0);
  const totalSpentSum = customers.reduce((acc, c) => acc + c.totalSpent, 0);

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <ProtectedRoute page="customers">
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Customers</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              View and manage your customers.
            </p>
          </div>

          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 rounded-2xl transition-all shadow-xs disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Customers */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Customers</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{totalCustomers}</p>
            </div>
          </div>

          {/* Card 2: Total Visits */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Visits</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{totalVisits}</p>
            </div>
          </div>

          {/* Card 3: Completed Services */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Completed Services</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{completedServices}</p>
            </div>
          </div>

          {/* Card 4: Total Spent */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <IndianRupee size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Spent</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                ₹{(totalSpentSum / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

        </div>

        {/* Search & Sort Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200/90 rounded-2xl pl-11 pr-4 py-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#5542f6] shadow-2xs transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Filter Dropdown */}
          <div className="relative min-w-[180px]">
            <SlidersHorizontal size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white border border-slate-200/90 rounded-2xl pl-9 pr-8 py-3 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:border-[#5542f6] shadow-2xs cursor-pointer"
            >
              <option value="visits">Most Visits</option>
              <option value="spent">Most Spent</option>
              <option value="recent">Most Recent</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 text-rose-600 bg-rose-50 border border-rose-200/80 rounded-2xl px-4 py-3 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              onClick={fetchCustomers}
              className="underline font-bold hover:text-rose-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Customer Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-6 space-y-4">
              <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Users size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No customers found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {search ? "No matching records found for your search." : "Customers will automatically appear here once they book appointments."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80">
                    <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 w-12 text-center">#</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Customer</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Phone</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Visits</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Completed</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Total Spent</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Avg Rating</th>
                    <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Last Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCustomers.map((c, index) => {
                    const rowNumber = startIndex + index + 1;
                    return (
                      <tr
                        key={c._id}
                        onClick={() => setSelectedCustomer(c)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Index */}
                        <td className="py-4 px-4 text-xs font-bold text-slate-400 text-center">
                          {rowNumber}
                        </td>

                        {/* Customer Avatar & Info */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {getInitials(c.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-900 group-hover:text-[#5542f6] transition-colors truncate">
                                {c.name}
                              </p>
                              <p className="text-[11px] font-medium text-slate-400 truncate">
                                {c.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-4 px-5 text-xs font-bold text-slate-600">
                          {c.phone || "—"}
                        </td>

                        {/* Visits */}
                        <td className="py-4 px-5 text-xs font-black text-slate-900">
                          {c.totalVisits}
                        </td>

                        {/* Completed */}
                        <td className="py-4 px-5 text-xs font-bold text-slate-600">
                          {c.completedVisits}
                        </td>

                        {/* Total Spent */}
                        <td className="py-4 px-5 text-xs font-black text-slate-900">
                          ₹{(c.totalSpent / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </td>

                        {/* Avg Rating */}
                        <td className="py-4 px-5 text-xs">
                          {c.avgRating ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              {c.avgRating}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-semibold">—</span>
                          )}
                        </td>

                        {/* Last Visit */}
                        <td className="py-4 px-5 text-xs font-medium text-slate-500">
                          {c.lastVisit ? timeAgo(c.lastVisit) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer with Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="border-t border-slate-200/80 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
              <p className="text-xs font-bold text-slate-500">
                Showing <span className="text-slate-800">{startIndex + 1}–{Math.min(startIndex + itemsPerPage, filtered.length)}</span> of{" "}
                <span className="text-slate-800">{filtered.length}</span> customers
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  title="First Page"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Last Page"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Customer Detail Drawer */}
        {selectedCustomer && (
          <CustomerDrawer
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// ── Customer Detail Drawer ──

function CustomerDrawer({
  customer: c,
  onClose,
}: {
  customer: CustomerData;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-slide-up max-h-[92vh] overflow-y-auto border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black shadow-xs">
              {getInitials(c.name)}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">{c.name}</h3>
              {c.avgRating ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 mt-0.5">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {c.avgRating} average rating
                </span>
              ) : (
                <p className="text-xs font-medium text-slate-400 mt-0.5">Customer Profile</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contact Info Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 rounded-2xl p-3 text-xs font-medium text-slate-700">
            <Mail size={15} className="text-slate-400 shrink-0" />
            <span className="truncate">{c.email || "No email"}</span>
          </div>
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 rounded-2xl p-3 text-xs font-medium text-slate-700">
            <Phone size={15} className="text-slate-400 shrink-0" />
            <span>{c.phone || "No phone"}</span>
          </div>
        </div>

        {/* 3 Metric Cards inside Drawer */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 text-center">
            <p className="text-xl font-black text-slate-900">{c.totalVisits}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Visits</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 text-center">
            <p className="text-xl font-black text-slate-900">{c.completedVisits}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Completed</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 text-center">
            <p className="text-xl font-black text-slate-900">
              ₹{(c.totalSpent / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Spent</p>
          </div>
        </div>

        {/* Appointment History List */}
        <div>
          <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
            Appointment History ({c.appointments.length})
          </p>

          {c.appointments.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs font-medium text-slate-400">No appointment history found.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {c.appointments.map((a) => {
                const style = STATUS_STYLES[a.status] || {
                  bg: "bg-slate-100 border-slate-200",
                  text: "text-slate-600",
                  label: a.status,
                };

                return (
                  <div
                    key={a._id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-slate-900">{a.serviceName}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${style.bg} ${style.text}`}
                      >
                        {style.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={12} className="text-slate-400" />
                          {a.date}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {a.startTime}
                        </span>
                        <span>with {a.staffName}</span>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        ₹{(a.price / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    {a.rating && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 mr-1">Rating:</span>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={11}
                            className={i < a.rating! ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}