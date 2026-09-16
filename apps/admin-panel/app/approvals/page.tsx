"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import {
  RefreshCw,
  Check,
  X,
  Building2,
  Phone,
  Mail,
  Calendar,
  FileText,
  Inbox,
  CheckCircle2,
  MapPin,
  User,
  Clock,
  ShieldAlert,
} from "lucide-react";

interface OwnerRequest {
  _id: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  salonName: string;
  salonDescription: string;
  password?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<OwnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [selectedRequest, setSelectedRequest] = useState<OwnerRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/owner-requests", {
        params: { status },
      });
      setRequests(data.data?.requests || []);
    } catch (err) {
      console.error("Failed to fetch owner requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function runAction(id: string, action: "approve" | "reject") {
    const note =
      action === "reject"
        ? prompt("Reason for rejection (included in notification email, optional):") ?? ""
        : undefined;

    if (action === "reject" && note === undefined) return;

    if (action === "approve") {
      const ok = confirm(
        "Approve this owner registration? This will instantly generate the owner account and activate their salon panel.",
      );
      if (!ok) return;
    }

    setBusyId(id);
    try {
      await apiClient.post(`/admin/owner-requests/${id}/${action}`, {
        ...(note !== undefined ? { note: note.trim() || null } : {}),
      });
      if (selectedRequest?._id === id) {
        setSelectedRequest(null);
      }
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const tabs: { key: typeof status; label: string }[] = [
    { key: "PENDING", label: "Pending Review" },
    { key: "ALL", label: "All Submissions" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Owner Approvals
            </h1>
            {status === "PENDING" && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {requests.length} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review and activate salon owner registration requests submitted from the landing page.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-indigo-600" : "text-indigo-600"} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 w-fit">
        {tabs.map((t) => {
          const isActive = status === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-16 text-center space-y-3 shadow-xs">
          <RefreshCw size={28} className="animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-bold text-slate-700">Loading owner applications...</p>
        </div>
      ) : requests.length === 0 ? (
        /* Empty State Card */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 sm:p-16 text-center shadow-xs space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <Inbox size={32} />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              No {status === "ALL" ? "" : status.toLowerCase() + " "}requests found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {status === "PENDING"
                ? "All submitted salon owner applications have been reviewed. New registrations from the public landing page will appear here."
                : `There are currently no owner applications under the "${status}" status.`}
            </p>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 size={13} />
              System operational & listening for landing page signups
            </span>
          </div>
        </div>
      ) : (
        /* Request Cards Grid */
        <div className="space-y-4">
          {requests.map((r) => {
            const isPending = r.status === "PENDING";
            const isApproved = r.status === "APPROVED";
            const isRejected = r.status === "REJECTED";

            return (
              <div
                key={r._id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:border-indigo-200 hover:shadow-lg transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left Info Column */}
                <div className="space-y-3 flex-1 min-w-0">
                  {/* Owner Header */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      {r.ownerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{r.ownerName}</h3>
                        {/* Status Badge */}
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border tracking-wide uppercase ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isRejected
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail size={12} className="text-slate-400" /> {r.ownerEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" /> <span className="font-mono text-slate-600 text-xs">{r.ownerPhone || "—"}</span>
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Salon Details Box */}
                  <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Building2 size={15} className="text-indigo-600 shrink-0" />
                      <span>{r.salonName}</span>
                    </div>

                    {r.salonDescription && (
                      <p className="text-slate-600 pl-5 leading-relaxed text-[11px]">
                        {r.salonDescription}
                      </p>
                    )}

                    <div className="flex items-center gap-4 pl-5 pt-1 text-[11px] text-slate-400 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Submitted: {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {r.adminNote && (
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <FileText size={12} className="text-indigo-500" />
                          Note: {r.adminNote}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Column */}
                <div className="flex flex-col items-start lg:items-end gap-3 shrink-0 lg:w-56 border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                  {/* View Salon Button */}
                  <button
                    onClick={() => setSelectedRequest(r)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Building2 size={13} className="text-indigo-600" />
                    <span>View Salon</span>
                  </button>

                  {/* Actions */}
                  {isPending ? (
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <button
                        onClick={() => runAction(r._id, "approve")}
                        disabled={busyId === r._id}
                        className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Check size={14} />
                        <span>{busyId === r._id ? "Processing..." : "Approve"}</span>
                      </button>

                      <button
                        onClick={() => runAction(r._id, "reject")}
                        disabled={busyId === r._id}
                        className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">
                      Reviewed: {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "N/A"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Salon Details Modal (Partial Salon & Owner Profile Details) */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{selectedRequest.salonName}</h3>
                  <p className="text-xs text-slate-500 font-medium">Partial Application Overview</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body - Grid of Requested Details */}
            <div className="space-y-4 text-xs">
              {/* Status Badge */}
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-500 font-semibold">Application Status</span>
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${
                    selectedRequest.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : selectedRequest.status === "REJECTED"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {selectedRequest.status}
                </span>
              </div>

              {/* Grid of Owner & Salon Information */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200/60">
                  Key Registration Information
                </p>

                <div className="space-y-3 text-slate-800">
                  {/* Owner Name */}
                  <div className="flex items-start gap-2.5">
                    <User size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Owner Name</span>
                      <span className="font-bold text-slate-900 text-sm">{selectedRequest.ownerName}</span>
                    </div>
                  </div>

                  {/* Email ID */}
                  <div className="flex items-start gap-2.5">
                    <Mail size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Email ID</span>
                      <span className="font-semibold text-slate-800">{selectedRequest.ownerEmail}</span>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="flex items-start gap-2.5">
                    <Phone size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Phone Number</span>
                      <span className="font-mono text-slate-700 text-xs font-semibold">{selectedRequest.ownerPhone || "—"}</span>
                    </div>
                  </div>

                  {/* Address / Description */}
                  <div className="flex items-start gap-2.5">
                    <MapPin size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Salon Address / Description</span>
                      <span className="font-medium text-slate-700 leading-relaxed block mt-0.5">
                        {selectedRequest.salonDescription || "Main branch / address details pending approval"}
                      </span>
                    </div>
                  </div>

                  {/* Register Date and Time */}
                  <div className="flex items-start gap-2.5">
                    <Clock size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Register Date & Time</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(selectedRequest.createdAt).toLocaleString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              {selectedRequest.status === "PENDING" && (
                <>
                  <button
                    onClick={() => runAction(selectedRequest._id, "approve")}
                    disabled={busyId === selectedRequest._id}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    Approve Application
                  </button>
                  <button
                    onClick={() => runAction(selectedRequest._id, "reject")}
                    disabled={busyId === selectedRequest._id}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all cursor-pointer"
                  >
                    Reject Application
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedRequest(null)}
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