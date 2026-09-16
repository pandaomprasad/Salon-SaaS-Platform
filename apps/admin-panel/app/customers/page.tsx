"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import {
  Search,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Calendar,
  X,
  ShieldCheck,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertCircle,
} from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Unmasking & Security State
  const [isUnmasked, setIsUnmasked] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);

  // Summary Metrics State
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
  });

  // Server-side Pagination State (10 rows per page by default)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCustomers = useCallback(
    async (targetPage = page, targetSearch = search, targetStatus = statusFilter, targetLimit = limit) => {
      setLoading(true);
      try {
        const { data } = await apiClient.get("/admin/customers", {
          params: {
            page: targetPage,
            limit: targetLimit,
            search: targetSearch.trim() || undefined,
            status: targetStatus !== "all" ? targetStatus : undefined,
          },
        });

        const resData = data.data || {};
        setCustomers(resData.customers || []);

        if (resData.summary) {
          setSummary(resData.summary);
        }

        if (resData.pagination) {
          setTotalCount(resData.pagination.total || 0);
          setTotalPages(resData.pagination.totalPages || 1);
          setPage(resData.pagination.page || targetPage);
        } else {
          setTotalCount(resData.customers?.length || 0);
          setTotalPages(Math.ceil((resData.customers?.length || 0) / targetLimit) || 1);
        }
      } catch (err) {
        console.error("Failed to fetch customers", err);
      } finally {
        setLoading(false);
      }
    },
    [page, search, statusFilter, limit]
  );

  useEffect(() => {
    fetchCustomers(1, search, statusFilter, limit);
  }, [search, statusFilter, limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      fetchCustomers(newPage, search, statusFilter, limit);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    fetchCustomers(1, search, statusFilter, newLimit);
  };

  const handleUnmaskToggle = () => {
    if (isUnmasked) {
      setIsUnmasked(false);
    } else {
      setShowVerifyModal(true);
      setVerifyPassword("");
      setVerifyError("");
    }
  };

  const handleVerifyPassword = async () => {
    if (!verifyPassword) {
      setVerifyError("Please enter your password.");
      return;
    }

    setVerifyLoading(true);
    setVerifyError("");

    try {
      await apiClient.post("/admin/verify-password", { password: verifyPassword });
      setIsUnmasked(true);
      setShowVerifyModal(false);
      setVerifyPassword("");
    } catch (err: any) {
      setVerifyError(
        err.response?.data?.message || "Incorrect password. Please try again."
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  const maskEmail = (email?: string) => {
    if (!email) return "—";
    const [user, domain] = email.split("@");
    if (!user || !domain) return email;
    if (user.length <= 2) return `${user[0]}*@${domain}`;
    return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return "—";
    const clean = phone.trim();
    if (clean.length <= 7) return "•••••••";
    return "•••••••" + clean.slice(7);
  };

  const getInitials = (name: string) => {
    if (!name) return "CU";
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
      {/* Sleek Compact KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 px-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customers</p>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">{summary.totalCustomers || totalCount}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
            <Users size={16} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 px-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Customers</p>
            <p className="text-base font-extrabold text-emerald-600 mt-0.5">{summary.activeCustomers || totalCount}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
            <UserCheck size={16} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 px-4 shadow-xs flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inactive Customers</p>
            <p className="text-base font-extrabold text-rose-600 mt-0.5">{summary.inactiveCustomers || 0}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
            <UserX size={16} />
          </div>
        </div>
      </div>

      {/* Unified Search & Status Filter Control Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name..."
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
              All ({summary.totalCustomers || totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Active ({summary.activeCustomers || totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === "inactive"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Inactive ({summary.inactiveCustomers || 0})
            </button>
          </div>

          {/* Unmask Contact Info Toggle Button */}
          <button
            onClick={handleUnmaskToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer ${
              isUnmasked
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            }`}
            title={isUnmasked ? "Mask contact info" : "Unmask contact info with password"}
          >
            {isUnmasked ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{isUnmasked ? "Mask Contact Info" : "Unmask Contact Info"}</span>
          </button>

          <button
            onClick={() => fetchCustomers(page)}
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
          <p className="text-xs font-bold text-slate-600">Fetching customer directory...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center space-y-2 shadow-xs max-w-md mx-auto">
          <Users size={28} className="text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No customers found</p>
          <p className="text-xs text-slate-400">
            {search ? "No customers match your search query." : "There are currently no registered customers."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex-1 max-h-[calc(100vh-215px)] overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200/80">
                <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <span>{isUnmasked ? "Email Address" : "Masked Email"}</span>
                      <button
                        onClick={handleUnmaskToggle}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 cursor-pointer"
                        title={isUnmasked ? "Click to mask" : "Click to unmask with password"}
                      >
                        {isUnmasked ? (
                          <Unlock size={11} className="text-emerald-500" />
                        ) : (
                          <Lock size={11} />
                        )}
                      </button>
                    </div>
                  </th>
                  <th className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <span>{isUnmasked ? "Phone Number" : "Masked Phone"}</span>
                      <button
                        onClick={handleUnmaskToggle}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 cursor-pointer"
                        title={isUnmasked ? "Click to mask" : "Click to unmask with password"}
                      >
                        {isUnmasked ? (
                          <Unlock size={11} className="text-emerald-500" />
                        ) : (
                          <Lock size={11} />
                        )}
                      </button>
                    </div>
                  </th>
                  <th className="px-4 py-2">Joined Date</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {customers.map((c) => {
                  const isActive = c.isActive !== false;

                  return (
                    <tr
                      key={c._id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Customer Avatar & Name */}
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-extrabold text-[10px] shadow-xs group-hover:scale-105 transition-transform shrink-0">
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                              {c.name || "Customer"}
                            </p>
                            <span className="text-[9px] font-semibold text-slate-400 block">
                              ID: {c._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email (Masked or Unmasked) */}
                      <td className="px-4 py-1.5 text-slate-600 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{isUnmasked ? c.email || "—" : maskEmail(c.email)}</span>
                          {!isUnmasked && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnmaskToggle();
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all p-0.5 cursor-pointer"
                              title="Click to unmask with password"
                            >
                              <Eye size={12} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Phone (Masked or Unmasked) */}
                      <td className="px-4 py-1.5 text-slate-600 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <span>{isUnmasked ? c.phone || "—" : maskPhone(c.phone)}</span>
                          {!isUnmasked && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnmaskToggle();
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all p-0.5 cursor-pointer"
                              title="Click to unmask with password"
                            >
                              <Eye size={12} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-1.5 text-slate-500 text-xs font-medium">
                        {formatDate(c.createdAt)}
                      </td>

                      {/* Status */}
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
                          {isActive ? "Active" : "Inactive"}
                        </span>
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
      {!loading && customers.length > 0 && (
        <div className="px-4 py-1.5 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <p className="text-slate-500 font-medium text-[11px]">
              Showing <span className="font-bold text-slate-900">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-bold text-slate-900">{Math.min(page * limit, totalCount)}</span> of{" "}
              <span className="font-bold text-slate-900">{totalCount}</span> customers
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

      {/* Password Verification Modal */}
      {showVerifyModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            setShowVerifyModal(false);
            setVerifyPassword("");
            setVerifyError("");
          }}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Security Verification</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Password required to unmask details</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setVerifyPassword("");
                  setVerifyError("");
                }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Please enter your admin password to view unmasked customer email addresses and phone numbers.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyPassword();
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Admin Password</label>
                <div className="relative">
                  <input
                    type={showModalPassword ? "text" : "password"}
                    value={verifyPassword}
                    onChange={(e) => {
                      setVerifyPassword(e.target.value);
                      setVerifyError("");
                    }}
                    placeholder="Enter your password..."
                    autoFocus
                    className="w-full h-10 pl-3.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showModalPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {verifyError && (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold animate-slide-in">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowVerifyModal(false);
                    setVerifyPassword("");
                    setVerifyError("");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {verifyLoading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={13} />
                      <span>Verify & Unmask</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Summary Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shrink-0">
                  {getInitials(selectedCustomer.name)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {selectedCustomer.name || "Customer Profile"}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    ID: {selectedCustomer._id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Account Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    selectedCustomer.isActive !== false
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {selectedCustomer.isActive !== false ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">
                        {isUnmasked ? "Email Address" : "Masked Email"}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {isUnmasked ? selectedCustomer.email || "—" : maskEmail(selectedCustomer.email)}
                      </span>
                    </div>
                  </div>
                  {!isUnmasked && (
                    <button
                      onClick={handleUnmaskToggle}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye size={11} />
                      <span>Unmask</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">
                        {isUnmasked ? "Phone Number" : "Masked Phone"}
                      </span>
                      <span className="font-bold text-slate-800 font-mono">
                        {isUnmasked ? selectedCustomer.phone || "—" : maskPhone(selectedCustomer.phone)}
                      </span>
                    </div>
                  </div>
                  {!isUnmasked && (
                    <button
                      onClick={handleUnmaskToggle}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye size={11} />
                      <span>Unmask</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <Calendar size={14} className="text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">Registration Date</span>
                    <span className="font-semibold text-slate-800">{formatDate(selectedCustomer.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}