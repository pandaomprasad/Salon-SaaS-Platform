"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import {
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Building2,
  Mail,
  Phone,
  ShieldAlert,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Owner {
  _id: string;
  name: string;
  email: string;
  phone: string;
  salonId: { _id: string; name: string; isActive: boolean } | null;
  isActive: boolean;
  createdAt: string;
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Summary Metrics State
  const [summary, setSummary] = useState({
    totalOwners: 0,
    activeOwners: 0,
    inactiveOwners: 0,
    linkedSalons: 0,
  });

  // Server-Side Pagination State (10 items per page by default)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Deactivation Modal State
  const [deactivatingOwner, setDeactivatingOwner] = useState<Owner | null>(null);
  const [reason, setReason] = useState("");
  const [deactivatingLoading, setDeactivatingLoading] = useState(false);

  const fetchOwners = useCallback(
    async (targetPage = page, targetSearch = search, targetStatus = statusFilter, targetLimit = limit) => {
      setLoading(true);
      try {
        const { data } = await apiClient.get("/admin/owners", {
          params: {
            page: targetPage,
            limit: targetLimit,
            search: targetSearch.trim() || undefined,
            status: targetStatus !== "all" ? targetStatus : undefined,
          },
        });
        const list = data.data?.owners || data.data || [];
        setOwners(Array.isArray(list) ? list : []);

        if (data.data?.summary) {
          setSummary(data.data.summary);
        }

        if (data.data?.pagination) {
          setTotalCount(data.data.pagination.total || 0);
          setTotalPages(data.data.pagination.totalPages || 1);
          setPage(data.data.pagination.page || targetPage);
        } else {
          setTotalCount(list.length);
          setTotalPages(Math.ceil(list.length / targetLimit) || 1);
        }
      } catch (err) {
        console.error("Failed to fetch owners", err);
        setOwners([]);
      } finally {
        setLoading(false);
      }
    },
    [page, search, statusFilter, limit]
  );

  useEffect(() => {
    fetchOwners(1, search, statusFilter, limit);
  }, [search, statusFilter, limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      fetchOwners(newPage, search, statusFilter, limit);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    fetchOwners(1, search, statusFilter, newLimit);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivatingOwner) return;
    if (!reason.trim()) {
      alert("Please provide a reason for deactivation.");
      return;
    }

    setDeactivatingLoading(true);
    try {
      await apiClient.patch(`/admin/owners/${deactivatingOwner._id}`, {
        isActive: false,
        reason: reason.trim(),
      });
      setDeactivatingOwner(null);
      setReason("");
      fetchOwners();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to deactivate owner");
    } finally {
      setDeactivatingLoading(false);
    }
  };

  const handleActivateOwner = async (owner: Owner) => {
    try {
      await apiClient.patch(`/admin/owners/${owner._id}`, {
        isActive: true,
      });
      fetchOwners();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to activate owner");
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "OW";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="space-y-3 animate-fade-in max-w-[1600px] mx-auto pb-2">
      {/* Sleek Compact KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Owners</p>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">{summary.totalOwners || totalCount}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 size={16} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Owners</p>
            <p className="text-base font-extrabold text-emerald-600 mt-0.5">{summary.activeOwners || totalCount}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck size={16} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inactive Owners</p>
            <p className="text-base font-extrabold text-rose-600 mt-0.5">{summary.inactiveOwners || 0}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <UserX size={16} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Linked Salons</p>
            <p className="text-base font-extrabold text-purple-600 mt-0.5">{summary.linkedSalons || 0}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Building2 size={16} />
          </div>
        </div>
      </div>

      {/* Unified Search & Filter Control Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by owner name, email or salon..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-100/80 border border-slate-200/80 rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All ({summary.totalOwners || totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Active ({summary.activeOwners || totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === "inactive"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Inactive ({summary.inactiveOwners || 0})
            </button>
          </div>

          <button
            onClick={() => fetchOwners()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw size={13} className={`text-indigo-600 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh List</span>
          </button>
        </div>
      </div>

      {/* Main Table Content with Sticky Header & Height Containment */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center space-y-2 shadow-xs">
          <RefreshCw size={24} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading salon owners directory...</p>
        </div>
      ) : owners.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center space-y-2 shadow-xs max-w-md mx-auto">
          <Building2 size={28} className="text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No salon owners found</p>
          <p className="text-xs text-slate-400">
            {search ? "No owners match your active search filter." : "There are currently no registered salon owners in the system."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex-1 max-h-[calc(100vh-215px)] overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200/80">
                <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-2">Owner</th>
                  <th className="px-4 py-2">Contact Information</th>
                  <th className="px-4 py-2">Associated Salon</th>
                  <th className="px-4 py-2">Joined Date</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {owners.map((o) => {
                  const isActive = o.isActive !== false;

                  return (
                    <tr
                      key={o._id}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Owner Column */}
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-extrabold text-[11px] shadow-xs group-hover:scale-105 transition-transform shrink-0">
                            {getInitials(o.name)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                              {o.name}
                            </p>
                            <span className="text-[10px] font-semibold text-slate-400 block">
                              ID: {o._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info Column */}
                      <td className="px-4 py-1.5">
                        <div className="space-y-0.5 text-xs">
                          <p className="text-slate-600 text-[11px] flex items-center gap-1">
                            <Mail size={10} className="text-slate-400 shrink-0" />
                            {o.email}
                          </p>
                          {o.phone && (
                            <p className="text-slate-400 text-[10px] flex items-center gap-1">
                              <Phone size={10} className="text-slate-400 shrink-0" />
                              {o.phone.length > 7 ? `${'X'.repeat(o.phone.length - 3)}${o.phone.slice(-3)}` : o.phone}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Associated Salon Column */}
                      <td className="px-4 py-1.5">
                        {o.salonId ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 size={11} className="text-indigo-500 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{o.salonId.name}</p>
                              <span
                                className={`text-[10px] font-bold ${
                                  o.salonId.isActive ? "text-emerald-600" : "text-rose-500"
                                }`}
                              >
                                {o.salonId.isActive ? "Salon Active" : "Salon Inactive"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No salon linked</span>
                        )}
                      </td>

                      {/* Joined Date Column */}
                      <td className="px-4 py-1.5 text-slate-500 text-[11px]">
                        {formatDate(o.createdAt)}
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 border ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-4 py-1.5 text-right">
                        {isActive ? (
                          <button
                            onClick={() => {
                              setDeactivatingOwner(o);
                              setReason("");
                            }}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateOwner(o)}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compact Pagination Controls Bar */}
      {!loading && owners.length > 0 && (
        <div className="px-4 py-1.5 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <p className="text-slate-500 font-medium text-[11px]">
              Showing <span className="font-bold text-slate-900">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-bold text-slate-900">{Math.min(page * limit, totalCount)}</span> of{" "}
              <span className="font-bold text-slate-900">{totalCount}</span> owners
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 border-l border-slate-200 pl-3">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 font-bold text-slate-800 text-[11px] focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value={6}>6</option>
                <option value={8}>8</option>
                <option value={10}>10</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-none">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  onClick={() => handlePageChange(pNum)}
                  className={`w-6 h-6 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    page === pNum
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {pNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Deactivation Reason Modal */}
      {deactivatingOwner && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            if (!deactivatingLoading) {
              setDeactivatingOwner(null);
              setReason("");
            }
          }}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Deactivate Owner Account</h3>
                  <p className="text-xs text-slate-500 font-medium">{deactivatingOwner.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!deactivatingLoading) {
                    setDeactivatingOwner(null);
                    setReason("");
                  }
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Warning Cascade Notice */}
            <div className="bg-rose-50/80 border border-rose-200/70 rounded-2xl p-4 space-y-1.5 text-xs text-rose-900">
              <p className="font-extrabold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                Automatic Cascade Action
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Deactivating <strong>{deactivatingOwner.name}</strong> will automatically deactivate all associated salons (
                <strong>{deactivatingOwner.salonId?.name || "All linked salons"}</strong>) and suspend their branch operations.
              </p>
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Reason for Deactivation <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify reason for deactivating this owner (e.g. Terms violation, Non-payment, Administrative lock...)"
                className="w-full border border-slate-200 rounded-2xl p-3 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium text-slate-800 resize-none transition-all"
              />

              {/* Preset Reason Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  "Violation of terms",
                  "Subscription expired",
                  "Administrative hold",
                  "Non-payment",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deactivatingLoading}
                onClick={() => {
                  setDeactivatingOwner(null);
                  setReason("");
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deactivatingLoading || !reason.trim()}
                onClick={handleDeactivateConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {deactivatingLoading && <RefreshCw size={13} className="animate-spin" />}
                Confirm & Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}