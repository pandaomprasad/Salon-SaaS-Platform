"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import { RefreshCw, Check, X, Eye, EyeOff, CalendarClock } from "lucide-react";

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
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/owner-requests", {
        params: { status },
      });
      setRequests(data.data?.requests || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function runAction(
    id: string,
    action: "approve" | "reject",
  ) {
    const note =
      action === "reject"
        ? prompt("Reason for rejection (shown to email audit trail, optional):") ?? ""
        : undefined;

    if (action === "reject" && note === undefined) return;

    if (action === "approve") {
      const ok = confirm(
        "Approve this request? This will create the owner account and their salon immediately.",
      );
      if (!ok) return;
    }

    setBusyId(id);
    try {
      await apiClient.post(`/admin/owner-requests/${id}/${action}`, {
        ...(note !== undefined ? { note: note.trim() || null } : {}),
      });
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const tabs: { key: typeof status; label: string }[] = [
    { key: "PENDING", label: "Pending" },
    { key: "ALL", label: "All" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Owner Approvals</h1>
          <p className="text-[13px] text-muted mt-1">
            Salon owners who registered from the landing page — approve to create their account
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="px-3 py-2 text-[12px] text-slate hover:text-ink bg-white border border-border rounded-lg flex items-center gap-1.5"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 bg-white border border-border rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={`px-3.5 py-1.5 text-[12px] font-medium rounded-md transition-all ${
              status === t.key
                ? "bg-accent text-white"
                : "text-slate hover:text-ink hover:bg-subtle"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-muted py-12 text-[13px]">Loading...</p>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-14 text-center">
          <CalendarClock size={28} className="mx-auto text-muted mb-3" />
          <p className="text-[13px] text-slate font-medium">No {status === "ALL" ? "" : status.toLowerCase() + " "}requests</p>
          <p className="text-[12px] text-muted mt-1">New owner registrations from the landing page will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r._id}
              className="bg-white border border-border rounded-xl p-5 flex flex-col lg:flex-row lg:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <p className="text-[14px] font-semibold text-ink">{r.ownerName}</p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${
                      r.status === "APPROVED"
                        ? "bg-success/10 text-success"
                        : r.status === "REJECTED"
                          ? "bg-danger/10 text-danger"
                          : "bg-warning/10 text-warning"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-[12px] text-slate mt-0.5">{r.ownerEmail} · {r.ownerPhone || "no phone"}</p>
                <div className="mt-3 grid gap-1 text-[12px]">
                  <p className="text-ink">
                    <span className="text-muted font-medium mr-1.5">Salon:</span>
                    {r.salonName}
                  </p>
                  {r.salonDescription && (
                    <p className="text-slate">
                      <span className="text-muted font-medium mr-1.5">Details:</span>
                      {r.salonDescription}
                    </p>
                  )}
                  <p className="text-slate">
                    <span className="text-muted font-medium mr-1.5">Submitted:</span>
                    {new Date(r.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {r.adminNote && (
                    <p className="text-slate">
                      <span className="text-muted font-medium mr-1.5">Admin note:</span>
                      {r.adminNote}
                    </p>
                  )}
                </div>
              </div>

              {/* Right rail — password reveal + actions */}
              <div className="flex lg:flex-col items-center lg:items-end gap-2 lg:w-48 shrink-0">
                <button
                  onClick={() =>
                    setRevealed((prev) => ({ ...prev, [r._id]: !prev[r._id] }))
                  }
                  className="text-[11px] font-medium text-slate hover:text-ink flex items-center gap-1.5"
                  title="Toggle temporary password visibility"
                >
                  {revealed[r._id] ? <EyeOff size={12} /> : <Eye size={12} />}
                  {revealed[r._id] ? (r.password ?? "—") : "Show password"}
                </button>

                {r.status === "PENDING" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runAction(r._id, "approve")}
                      disabled={busyId === r._id}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white bg-success hover:bg-success/90 px-3.5 py-2 rounded-lg disabled:opacity-40"
                    >
                      <Check size={13} /> {busyId === r._id ? "Working..." : "Approve"}
                    </button>
                    <button
                      onClick={() => runAction(r._id, "reject")}
                      disabled={busyId === r._id}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-danger bg-danger/5 hover:bg-danger/10 border border-danger/20 px-3.5 py-2 rounded-lg disabled:opacity-40"
                    >
                      <X size={13} /> Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-muted">
                    Reviewed {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}