"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Modal from "@/components/ui/Modal";
import apiClient from "@/lib/api-client";
import { useBranch } from "@/hooks/useBranch";
import GooglePlaceSearch, { PlaceResult } from "@/components/GooglePlaceSearch";
import LocationMapPreview from "@/components/LocationMapPreview";
import {
  Search,
  RefreshCw,
  Plus,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  X,
  Store,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowUpDown,
  UserCheck,
  Calendar,
  Copy,
  Check,
} from "lucide-react";
import { getCached, setCache, invalidateCache } from "@/lib/cache";

// ── Types ──

interface Branch {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    coordinates?: {
      lat: number | null;
      lng: number | null;
    };
  };
  contactPhone: string;
  contactEmail: string;
  workingHours: {
    day: number;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }[];
  slotDurationMinutes: number;
  advanceBookingDays: number;
  managerId: { _id: string; name: string; email: string; phone: string } | null;
  isActive: boolean;
  createdAt: string;
}

// ── Helpers ──

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function getOpenDays(workingHours: Branch["workingHours"]): string {
  const open = workingHours.filter((w) => w.isOpen).map((w) => DAY_NAMES[w.day]);
  if (open.length === 7) return "Every day";
  if (open.length === 0) return "Closed";
  return open.join(", ");
}

function getTimings(workingHours: Branch["workingHours"]): string {
  const first = workingHours.find((w) => w.isOpen);
  if (!first) return "—";
  return `${first.openTime} – ${first.closeTime}`;
}

// ── Page ──

export default function BranchesPage() {
  const { salonId } = useBranch();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    if (!salonId) return;

    const cacheKey = `branches_${salonId}`;
    const cached = getCached<Branch[]>(cacheKey);

    if (cached) {
      setBranches(cached);
      setLoading(false);
      try {
        const { data } = await apiClient.get(`/salons/${salonId}/branches`);
        const list = data.data?.branches || [];
        setBranches(list);
        setCache(cacheKey, list);
      } catch {}
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/salons/${salonId}/branches`);
      const list = data.data?.branches || [];
      setBranches(list);
      setCache(cacheKey, list);
    } catch {
      setError("Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("addBranch") === "true" || params.get("openModal") === "true") {
        setShowAddModal(true);
      }
    }

    function handleOpenEvent() {
      setShowAddModal(true);
    }

    window.addEventListener("open-add-branch-modal", handleOpenEvent);
    return () => window.removeEventListener("open-add-branch-modal", handleOpenEvent);
  }, []);

  // Filter & Sort
  const filtered = branches
    .filter((b) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.address.city.toLowerCase().includes(q) ||
        b.address.state.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  // Delete Branch
  async function handleDeleteBranch(branchId: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this branch?")) return;
    try {
      await apiClient.delete(`/salons/${salonId}/branches/${branchId}`);
      invalidateCache("branches_");
      setBranches((prev) => prev.filter((b) => b._id !== branchId));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete branch");
    }
  }

  return (
    <ProtectedRoute page="branches">
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Branches</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Manage your salon branches and their details.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={fetchBranches}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 rounded-2xl transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-xs"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add Branch</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200/90 rounded-2xl pl-11 pr-4 py-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-2xs transition-all"
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

          {/* Sort Dropdown */}
          <div className="relative min-w-[180px]">
            <ArrowUpDown size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-8 py-3 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:border-slate-900 shadow-2xs cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Subheader Count */}
        <div className="text-xs font-bold text-slate-500 pl-0.5">
          {loading ? "Loading branches..." : `${filtered.length} ${filtered.length === 1 ? "branch" : "branches"}`}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 text-rose-600 bg-rose-50 border border-rose-200/80 rounded-2xl px-4 py-3 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <p className="flex-1">{error}</p>
            <button onClick={fetchBranches} className="underline font-bold hover:text-rose-800">
              Retry
            </button>
          </div>
        )}

        {/* Branch Cards List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-slate-100 rounded-lg w-1/4 animate-pulse" />
                  <div className="h-6 bg-slate-100 rounded-lg w-20 animate-pulse" />
                </div>
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center max-w-md mx-auto my-6 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Store size={26} strokeWidth={2} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">No branches registered yet</h3>
            <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">
              Create your first branch location to start managing staff, schedules, and customer appointments.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-xs"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Register Your First Branch</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => (
              <div
                key={b._id}
                onClick={() => setSelectedBranch(b)}
                className={`bg-white border border-slate-200/90 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md hover:border-slate-300 ${
                  b.isActive ? "" : "opacity-60 bg-slate-50/50"
                }`}
              >
                {/* Top Row: Store Icon + Name + City + Slot Pill + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                      <Store size={26} strokeWidth={2} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-lg text-slate-900 tracking-tight truncate">
                          {b.name}
                        </h3>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            b.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              : "bg-rose-50 text-rose-600 border-rose-200/80"
                          }`}
                        >
                          {b.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 mt-0.5 truncate">
                        {b.address.city}, {b.address.state}
                      </p>
                    </div>
                  </div>

                  {/* Slot duration badge + Three Dots Menu */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-[11px] font-extrabold text-[#0284c7] bg-[#e0f2fe]/80 border border-[#bae6fd] px-3 py-1 rounded-xl">
                      {b.slotDurationMinutes}min slots
                    </span>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === b._id ? null : b._id);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === b._id && (
                        <div
                          className="absolute right-0 top-10 z-20 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 text-xs font-bold text-slate-700 animate-fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setSelectedBranch(b);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Pencil size={13} className="text-slate-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setShowAddModal(true);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Copy size={13} className="text-slate-400" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            onClick={(e) => {
                              setActiveMenuId(null);
                              handleDeleteBranch(b._id, e);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle Info Horizontal Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 border-t border-slate-100 mt-5 pt-4 text-xs font-medium text-slate-600">
                  {/* Address */}
                  <div className="flex items-center gap-2.5 truncate">
                    <MapPin size={15} className="text-slate-400 shrink-0" />
                    <span className="truncate">{b.address.street || b.address.city}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-2.5">
                    <Phone size={15} className="text-slate-400 shrink-0" />
                    <span>{b.contactPhone}</span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2.5 truncate">
                    <Mail size={15} className="text-slate-400 shrink-0" />
                    <span className="truncate">{b.contactEmail || "—"}</span>
                  </div>

                  {/* Working Hours */}
                  <div className="flex items-center gap-2.5 truncate">
                    <Clock size={15} className="text-slate-400 shrink-0" />
                    <span className="truncate">{getTimings(b.workingHours)}</span>
                  </div>

                  {/* Manager */}
                  <div className="flex items-center gap-2.5 truncate">
                    <UserCheck size={15} className="text-slate-400 shrink-0" />
                    <span className="truncate">
                      Manager: {b.managerId ? b.managerId.name : "Unassigned"}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Created Date */}
                <div className="mt-4 pt-3 border-t border-slate-100/70 text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  <span>Created on {formatDate(b.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Branch Drawer */}
        {selectedBranch && (
          <BranchDrawer
            branch={selectedBranch}
            salonId={salonId}
            onUpdate={async () => {
              setSelectedBranch(null);
              invalidateCache("branches_");
              await fetchBranches();
            }}
            onClose={() => setSelectedBranch(null)}
          />
        )}

        {/* Add Branch Modal */}
        {showAddModal && (
          <AddBranchModal
            salonId={salonId}
            onSuccess={() => {
              setShowAddModal(false);
              invalidateCache("branches_");
              fetchBranches();
            }}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// ── Branch Drawer ──

function BranchDrawer({
  branch: b,
  salonId,
  onUpdate,
  onClose,
}: {
  branch: Branch;
  salonId: string;
  onUpdate: () => void;
  onClose: () => void;
}) {
  const [managers, setManagers] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState(b.managerId?._id || "");
  const [assigning, setAssigning] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [editingHours, setEditingHours] = useState(false);
  const [editHours, setEditHours] = useState(
    b.workingHours.map((wh) => ({
      day: wh.day,
      isOpen: wh.isOpen,
      openTime: wh.openTime,
      closeTime: wh.closeTime,
    }))
  );
  const [savingHours, setSavingHours] = useState(false);
  const [hoursError, setHoursError] = useState<string | null>(null);

  useEffect(() => {
    if (!showAssign) return;
    async function fetchManagers() {
      setLoadingManagers(true);
      try {
        const { data } = await apiClient.get(`/branches/${b._id}/staff`);
        const staff = data.data?.staff || [];
        setManagers(staff.filter((s: any) => s.role?.name === "manager" && s.isActive));
      } catch {
        setAssignError("Failed to load managers");
      } finally {
        setLoadingManagers(false);
      }
    }
    fetchManagers();
  }, [showAssign, b._id]);

  async function handleAssignManager() {
    if (!selectedManagerId) return;
    setAssigning(true);
    setAssignError(null);
    try {
      await apiClient.patch(`/salons/${salonId}/branches/${b._id}`, {
        managerId: selectedManagerId,
      });
      setShowAssign(false);
      onUpdate();
    } catch (err: any) {
      setAssignError(err.response?.data?.message || "Failed to assign manager");
    } finally {
      setAssigning(false);
    }
  }

  async function handleSaveHours() {
    setSavingHours(true);
    setHoursError(null);
    try {
      await apiClient.patch(`/salons/${salonId}/branches/${b._id}`, {
        workingHours: editHours,
      });
      setEditingHours(false);
      onUpdate();
    } catch (err: any) {
      setHoursError(err.response?.data?.message || "Failed to update working hours");
    } finally {
      setSavingHours(false);
    }
  }

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
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shadow-xs">
              <Store size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">{b.name}</h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                {b.address.city}, {b.address.state}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Details Grid */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3 mb-6 text-xs">
          {[
            ["Status", b.isActive ? "Active" : "Inactive"],
            ["Address", `${b.address.street}, ${b.address.city}, ${b.address.state} – ${b.address.pincode}`],
            ["Phone", b.contactPhone],
            ["Email", b.contactEmail || "—"],
            ["Slot Duration", `${b.slotDurationMinutes} minutes`],
            ["Advance Booking", `${b.advanceBookingDays} days`],
            ["Created", formatDate(b.createdAt)],
          ].map(([key, val]) => (
            <div key={key} className="flex justify-between gap-4 border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] shrink-0">{key}</span>
              <span className="font-bold text-slate-800 text-right">{val}</span>
            </div>
          ))}
        </div>

        {/* Map Preview */}
        {b.address.coordinates && b.address.coordinates.lat && (
          <div className="mb-6">
            <LocationMapPreview
              coordinates={b.address.coordinates}
              address={`${b.address.street}, ${b.address.city}`}
            />
          </div>
        )}

        {/* Manager Section */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-6 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-extrabold text-slate-900">Branch Manager</p>
            <button
              onClick={() => setShowAssign(!showAssign)}
              className="text-xs font-bold text-[#5542f6] hover:underline"
            >
              {showAssign ? "Cancel" : b.managerId ? "Change" : "Assign"}
            </button>
          </div>

          {!showAssign ? (
            b.managerId ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-extrabold">
                  {b.managerId.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">{b.managerId.name}</p>
                  <p className="text-[11px] font-medium text-slate-400">{b.managerId.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-400">No manager assigned</p>
            )
          ) : (
            <div className="space-y-3">
              {loadingManagers ? (
                <p className="text-xs font-medium text-slate-400">Loading managers...</p>
              ) : managers.length === 0 ? (
                <div className="text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-xl">
                  <p>No managers found for this branch.</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Add a staff member with role <span className="font-bold">Manager</span> first under Staff.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {managers.map((m) => (
                      <button
                        key={m._id}
                        onClick={() => setSelectedManagerId(m._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          selectedManagerId === m._id
                            ? "bg-slate-900 text-white"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-800"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                          {m.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{m.name}</p>
                          <p className="text-[10px] opacity-70">{m.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleAssignManager}
                    disabled={assigning || !selectedManagerId}
                    className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50"
                  >
                    Assign Manager
                  </button>
                </>
              )}
              {assignError && <p className="text-xs text-rose-600 font-medium">{assignError}</p>}
            </div>
          )}
        </div>

        {/* Working Hours Section */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-extrabold text-slate-900">Working Hours</p>
            <button
              onClick={() => setEditingHours(!editingHours)}
              className="text-xs font-bold text-[#5542f6] hover:underline"
            >
              {editingHours ? "Cancel" : "Edit"}
            </button>
          </div>

          {!editingHours ? (
            <div className="space-y-1.5">
              {b.workingHours.map((wh) => (
                <div
                  key={wh.day}
                  className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl ${
                    wh.isOpen ? "bg-slate-50 text-slate-800 font-medium" : "bg-slate-50/50 text-slate-400"
                  }`}
                >
                  <span className="font-bold w-12">{DAY_NAMES[wh.day]}</span>
                  {wh.isOpen ? (
                    <span className="font-bold">{wh.openTime} – {wh.closeTime}</span>
                  ) : (
                    <span className="font-bold text-rose-500">Closed</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {editHours.map((wh) => (
                <div
                  key={wh.day}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                    wh.isOpen ? "bg-slate-50" : "bg-slate-50/50"
                  }`}
                >
                  <span className="text-xs font-bold w-10 text-slate-800">{DAY_NAMES[wh.day]}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditHours((prev) =>
                        prev.map((h) => (h.day === wh.day ? { ...h, isOpen: !h.isOpen } : h))
                      )
                    }
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                      wh.isOpen ? "bg-[#5542f6]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        wh.isOpen ? "left-4.5" : "left-0.5"
                      }`}
                    />
                  </button>
                  {wh.isOpen ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="time"
                        value={wh.openTime}
                        onChange={(e) =>
                          setEditHours((prev) =>
                            prev.map((h) => (h.day === wh.day ? { ...h, openTime: e.target.value } : h))
                          )
                        }
                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 bg-white"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">to</span>
                      <input
                        type="time"
                        value={wh.closeTime}
                        onChange={(e) =>
                          setEditHours((prev) =>
                            prev.map((h) => (h.day === wh.day ? { ...h, closeTime: e.target.value } : h))
                          )
                        }
                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 bg-white"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-rose-500">Closed</span>
                  )}
                </div>
              ))}
              {hoursError && <p className="text-xs text-rose-600 font-medium">{hoursError}</p>}
              <button
                onClick={handleSaveHours}
                disabled={savingHours}
                className="w-full mt-3 bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50"
              >
                {savingHours ? "Saving..." : "Save Working Hours"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Branch Modal ──

function AddBranchModal({
  salonId,
  onSuccess,
  onClose,
}: {
  salonId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const defaultHours = DAY_NAMES.map((_, i) => ({
    day: i,
    isOpen: i !== 0,
    openTime: "09:00",
    closeTime: "21:00",
  }));

  const [form, setForm] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    contactPhone: "",
    contactEmail: "",
    slotDurationMinutes: "60",
  });
  const [coordinates, setCoordinates] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [formattedAddress, setFormattedAddress] = useState<string>("");

  const [workingHours, setWorkingHours] = useState(defaultHours);
  const [fieldErrors, setFieldErrors] = useState<{ field: string; message: string }[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => prev.filter((e) => !e.field.includes(key)));
    setServerError(null);
  }

  function handlePlaceSelect(place: PlaceResult) {
    setForm((prev) => ({
      ...prev,
      street: place.street || prev.street,
      city: place.city || prev.city,
      state: place.state || prev.state,
      pincode: place.pincode || prev.pincode,
      name: prev.name.trim() ? prev.name : place.placeName || prev.name,
    }));
    if (place.latitude !== null && place.longitude !== null) {
      setCoordinates({ lat: place.latitude, lng: place.longitude });
    }
    if (place.formattedAddress) {
      setFormattedAddress(place.formattedAddress);
    }
  }

  function getError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  async function handleSubmit() {
    const errors: { field: string; message: string }[] = [];
    if (!form.name.trim()) errors.push({ field: "name", message: "Branch name is required" });
    if (!form.city.trim()) errors.push({ field: "city", message: "City is required" });
    if (!form.contactPhone.trim())
      errors.push({ field: "contactPhone", message: "Phone is required" });

    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setServerError(null);

    const payload: any = {
      name: form.name.trim(),
      address: {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        country: "India",
        coordinates:
          coordinates.lat !== null && coordinates.lng !== null
            ? { lat: coordinates.lat, lng: coordinates.lng }
            : undefined,
      },
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim() || undefined,
      slotDurationMinutes: Number(form.slotDurationMinutes) || 60,
      workingHours,
    };

    try {
      await apiClient.post(`/salons/${salonId}/branches`, payload);
      onSuccess();
    } catch (err: any) {
      const res = err.response?.data;
      if (res?.errors && Array.isArray(res.errors)) {
        setFieldErrors(res.errors);
      } else {
        setServerError(res?.message || "Failed to create branch");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Register New Branch" onClose={onClose}>
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        
        {/* Google Place Search */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Search Location (Google Maps)
          </label>
          <GooglePlaceSearch
            onPlaceSelect={handlePlaceSelect}
            placeholder="Type address or landmark to auto-fill location details..."
          />
        </div>

        {/* Location Map Preview */}
        {coordinates.lat && coordinates.lng && (
          <div className="mt-2">
            <LocationMapPreview
              coordinates={coordinates}
              address={formattedAddress || `${form.street}, ${form.city}`}
            />
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
          <input
            type="text"
            placeholder="e.g. Bandra West Studio"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
          />
          {getError("name") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("name")}</p>}
        </div>

        {/* Street & City */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              placeholder="e.g. 14 Linking Road"
              value={form.street}
              onChange={(e) => set("street", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
            <input
              type="text"
              placeholder="e.g. Mumbai"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
            />
            {getError("city") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("city")}</p>}
          </div>
        </div>

        {/* State & Pincode */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
            <input
              type="text"
              placeholder="e.g. Maharashtra"
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
            <input
              type="text"
              placeholder="e.g. 400050"
              value={form.pincode}
              onChange={(e) => set("pincode", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
            />
          </div>
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
            <input
              type="text"
              placeholder="+91-9800000000"
              value={form.contactPhone}
              onChange={(e) => set("contactPhone", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
            />
            {getError("contactPhone") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("contactPhone")}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
            <input
              type="email"
              placeholder="bandra@salon.com"
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
            />
          </div>
        </div>

        {/* Slot Duration */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Slot Duration</label>
          <select
            value={form.slotDurationMinutes}
            onChange={(e) => set("slotDurationMinutes", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs cursor-pointer"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>

        {serverError && (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200/80 rounded-xl px-3 py-2.5 text-xs font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <p>{serverError}</p>
          </div>
        )}
      </div>

      {/* Modal Footer Actions */}
      <div className="flex gap-3 mt-6 border-t border-slate-100 pt-4">
        <button
          onClick={onClose}
          className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Branch"}
        </button>
      </div>
    </Modal>
  );
}