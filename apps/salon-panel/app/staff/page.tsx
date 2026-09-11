"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AddStaffModal from "@/components/staff/AddStaffModal";
import apiClient from "@/lib/api-client";
import { useBranch } from "@/hooks/useBranch";
import {
  Search,
  RefreshCw,
  Plus,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  MoreVertical,
  X,
  ArrowUpDown,
  UserX,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { getCached, setCache, invalidateCache } from "@/lib/cache";

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: { _id: string; name: string };
  salonId: string;
  branchId: string;
  avatar: string | null;
  extraPermissions: string[];
  deniedPermissions: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
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

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function StaffPage() {
  const { branchId, canManage } = useBranch();

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    if (!branchId) return;

    const cacheKey = `staff_${branchId}`;
    const cached = getCached<StaffMember[]>(cacheKey);

    if (cached) {
      setStaffList(cached);
      setLoading(false);
      try {
        const { data } = await apiClient.get(`/branches/${branchId}/staff`);
        const list = data.data?.staff || [];
        setStaffList(list);
        setCache(cacheKey, list);
      } catch {}
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/branches/${branchId}/staff`);
      const list = data.data?.staff || [];
      setStaffList(list);
      setCache(cacheKey, list);
    } catch {
      setError("Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    setStaffList([]);
    fetchStaff();
  }, [fetchStaff]);

  const filtered = staffList
    .filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        (s.phone && s.phone.includes(search));
      const matchRole = roleFilter === "all" || s.role.name.toLowerCase() === roleFilter.toLowerCase();
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  async function handleDeactivate(staffId: string) {
    if (!confirm("Are you sure you want to deactivate this staff member?")) return;
    setDeactivatingId(staffId);
    try {
      await apiClient.delete(`/branches/${branchId}/staff/${staffId}`);
      invalidateCache("staff_");
      setStaffList((prev) => prev.map((s) => (s._id === staffId ? { ...s, isActive: false } : s)));
      setSelectedStaff(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to deactivate staff");
    } finally {
      setDeactivatingId(null);
    }
  }

  return (
    <ProtectedRoute page="staff">
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Manage your team members and their roles.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={fetchStaff}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 rounded-2xl transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            {canManage && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-[#5542f6] hover:bg-[#4332e0] text-white rounded-2xl transition-all shadow-xs"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add Staff</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Control Toolbar */}
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

          {/* Role & Sort Filters */}
          <div className="flex items-center gap-2.5">
            {/* Role Dropdown */}
            <div className="relative flex-1 sm:w-44">
              <UserCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-8 py-3 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:border-[#5542f6] shadow-2xs cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:w-44">
              <ArrowUpDown size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-8 py-3 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:border-[#5542f6] shadow-2xs cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A - Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Count Header */}
        <div className="text-xs font-bold text-slate-500 pl-0.5">
          {loading ? "Loading staff..." : `${filtered.length} staff members`}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 text-rose-600 bg-rose-50 border border-rose-200/80 rounded-2xl px-4 py-3 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <p className="flex-1">{error}</p>
            <button onClick={fetchStaff} className="underline font-bold hover:text-rose-800">
              Retry
            </button>
          </div>
        )}

        {/* Staff Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 animate-pulse shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-100 rounded-lg w-1/2 animate-pulse" />
                    <div className="h-3 bg-slate-100 rounded-lg w-1/3 animate-pulse" />
                  </div>
                </div>
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <UserCheck size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No staff members found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || roleFilter !== "all"
                ? "No team members match your filter criteria."
                : "Click '+ Add Staff' to invite team members to your branch."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((s) => {
              const isManager = s.role.name.toLowerCase() === "manager";
              const avatarStyle = isManager
                ? "bg-[#efeefd] text-[#5542f6]"
                : "bg-emerald-50 text-emerald-600";
              const badgeStyle = isManager
                ? "bg-blue-50 text-blue-700 border-blue-200/80"
                : "bg-emerald-50 text-emerald-700 border-emerald-200/80";

              return (
                <div
                  key={s._id}
                  onClick={() => setSelectedStaff(s)}
                  className={`bg-white border border-slate-200/90 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md hover:border-slate-300 flex flex-col justify-between group ${
                    s.isActive ? "" : "opacity-60 bg-slate-50/50"
                  }`}
                >
                  <div>
                    {/* Top Row: Avatar + Name + Role Badge + Action */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Avatar initials circle */}
                        <div className={`w-12 h-12 rounded-full ${avatarStyle} font-black text-sm flex items-center justify-center shrink-0 shadow-2xs`}>
                          {getInitials(s.name)}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#5542f6] transition-colors truncate">
                            {s.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border capitalize ${badgeStyle}`}
                            >
                              {s.role.name}
                            </span>
                            {!s.isActive && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/80">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStaff(s);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100 my-3.5" />

                    {/* Details list */}
                    <div className="space-y-2 text-xs font-bold text-slate-600">
                      <div className="flex items-center gap-2.5 truncate">
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Phone size={14} className="text-slate-400 shrink-0" />
                        <span>{s.phone || "—"}</span>
                      </div>

                      <div className="flex items-center gap-2.5 text-slate-500 font-medium pt-0.5">
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                        <span>Joined {formatDate(s.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Staff Detail Drawer */}
        {selectedStaff && (
          <StaffDrawer
            staff={selectedStaff}
            canManage={canManage}
            onDeactivate={handleDeactivate}
            deactivatingId={deactivatingId}
            onClose={() => setSelectedStaff(null)}
          />
        )}

        {/* Add Staff Modal */}
        {showAddModal && (
          <AddStaffModal
            branchId={branchId}
            onSuccess={() => {
              setShowAddModal(false);
              invalidateCache("staff_");
              fetchStaff();
            }}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// ── Staff Detail Drawer ──

function StaffDrawer({
  staff: s,
  canManage,
  onDeactivate,
  deactivatingId,
  onClose,
}: {
  staff: StaffMember;
  canManage: boolean;
  onDeactivate: (id: string) => void;
  deactivatingId: string | null;
  onClose: () => void;
}) {
  const isManager = s.role.name.toLowerCase() === "manager";
  const avatarStyle = isManager
    ? "bg-[#efeefd] text-[#5542f6]"
    : "bg-emerald-50 text-emerald-600";
  const badgeStyle = isManager
    ? "bg-blue-50 text-blue-700 border-blue-200/80"
    : "bg-emerald-50 text-emerald-700 border-emerald-200/80";

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-slide-up max-h-[92vh] overflow-y-auto border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-full ${avatarStyle} flex items-center justify-center text-sm font-black shadow-xs`}>
              {getInitials(s.name)}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">{s.name}</h3>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border capitalize mt-0.5 inline-block ${badgeStyle}`}>
                {s.role.name}
              </span>
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
        <div className="space-y-2.5 mb-6">
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 rounded-2xl p-3 text-xs font-medium text-slate-700">
            <Mail size={15} className="text-slate-400 shrink-0" />
            <span className="truncate">{s.email}</span>
          </div>
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 rounded-2xl p-3 text-xs font-medium text-slate-700">
            <Phone size={15} className="text-slate-400 shrink-0" />
            <span>{s.phone || "No phone provided"}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3 mb-6 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Status</span>
            <span className={`font-extrabold px-2 py-0.5 rounded-md text-[11px] ${s.isActive ? "bg-emerald-100/80 text-emerald-800" : "bg-rose-100/80 text-rose-800"}`}>
              {s.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Joined Date</span>
            <span className="font-bold text-slate-800">{formatDate(s.createdAt)}</span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Last Login</span>
            <span className="font-bold text-slate-800">{s.lastLoginAt ? formatDate(s.lastLoginAt) : "Never"}</span>
          </div>
        </div>

        {/* Deactivate Button */}
        {canManage && s.isActive && (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onDeactivate(s._id)}
              disabled={deactivatingId === s._id}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs py-3 rounded-2xl transition-all border border-rose-200/80 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <UserX size={15} />
              <span>{deactivatingId === s._id ? "Deactivating..." : "Deactivate Staff Member"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}