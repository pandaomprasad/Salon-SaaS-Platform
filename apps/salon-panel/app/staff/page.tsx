"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import AddStaffModal from "@/components/staff/AddStaffModal";
import apiClient from "@/lib/api-client";
import { useBranch } from "@/hooks/useBranch";
import {
  Search, RefreshCw, Plus, AlertCircle, Phone, Mail, X,
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
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function StaffPage() {
  const { branchId, canManage } = useBranch();

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
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
      // Background refresh
      try {
        const { data } = await apiClient.get(`/branches/${branchId}/staff`);
        const list = data.data?.staff || [];
        setStaffList(list);
        setCache(cacheKey, list);
      } catch { }
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

  const filtered = staffList.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || s.role.name === roleFilter;
    return matchSearch && matchRole;
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
      alert(err.response?.data?.message || "Failed to deactivate");
    } finally {
      setDeactivatingId(null);
    }
  }

  return (
    <ProtectedRoute page="staff">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Staff</h2>
            <p className="text-[13px] text-muted mt-1">
              {loading ? "Loading..." : `${filtered.length} staff members`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={fetchStaff} loading={loading}>
              Refresh
            </Button>
            {canManage && (
              <Button size="sm" icon={<Plus size={13} />} onClick={() => setShowAddModal(true)}>
                Add Staff
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-60">
            <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={14} />} />
          </div>
          <div className="w-40">
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} options={[
              { value: "all", label: "All Roles" },
              { value: "manager", label: "Manager" },
              { value: "staff", label: "Staff" },
            ]} />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-danger bg-danger/5 rounded-lg px-4 py-3">
            <AlertCircle size={14} />
            <p className="text-[13px]">{error}</p>
            <Button size="sm" variant="ghost" onClick={fetchStaff}>Retry</Button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="animate-pulse bg-border/50 rounded-lg w-10 h-10" />
                  <div className="flex-1 space-y-2">
                    <div className="animate-pulse bg-border/50 rounded h-3.5 w-1/3" />
                    <div className="animate-pulse bg-border/50 rounded h-3 w-1/4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="animate-pulse bg-border/50 rounded h-3 w-3/4" />
                  <div className="animate-pulse bg-border/50 rounded h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted py-12 text-[13px]">No staff members found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <div
                key={s._id}
                onClick={() => setSelectedStaff(s)}
                className={`bg-white border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md hover:border-accent/20 ${s.isActive ? "border-border" : "border-danger/20 opacity-60"
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-subtle text-ink flex items-center justify-center text-[12px] font-semibold shrink-0">
                    {getInitials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[13px] truncate">{s.name}</h3>
                      {!s.isActive && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-danger/10 text-danger">Inactive</span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-subtle text-slate capitalize mt-1 inline-block">
                      {s.role.name}
                    </span>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-[12px] text-slate">
                    <Mail size={11} /><span className="truncate">{s.email}</span>
                  </div>
                  {s.phone && (
                    <div className="flex items-center gap-2 text-[12px] text-slate">
                      <Phone size={11} /><span>{s.phone}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted">
                  Joined {formatDate(s.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedStaff && (
          <StaffDrawer staff={selectedStaff} canManage={canManage} onDeactivate={handleDeactivate} deactivatingId={deactivatingId} onClose={() => setSelectedStaff(null)} />
        )}

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

function StaffDrawer({ staff: s, canManage, onDeactivate, deactivatingId, onClose }: {
  staff: StaffMember; canManage: boolean; onDeactivate: (id: string) => void; deactivatingId: string | null; onClose: () => void;
}) {
  const details = [
    ["Name", s.name], ["Email", s.email], ["Phone", s.phone || "—"],
    ["Role", s.role.name], ["Status", s.isActive ? "Active" : "Inactive"],
    ["Joined", formatDate(s.createdAt)], ["Last Login", s.lastLoginAt ? formatDate(s.lastLoginAt) : "Never"],
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-end p-6" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl border border-border animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-subtle text-ink flex items-center justify-center text-[12px] font-semibold">
              {getInitials(s.name)}
            </div>
            <div>
              <h3 className="font-semibold text-[15px]">{s.name}</h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-subtle text-slate capitalize">{s.role.name}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors p-1 rounded-md hover:bg-subtle">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 text-[13px]">
          {details.map(([key, val]) => (
            <div key={key} className="flex justify-between">
              <span className="text-slate">{key}</span>
              <span className="font-medium capitalize">{val}</span>
            </div>
          ))}
        </div>
        {canManage && s.isActive && (
          <div className="mt-6 pt-5 border-t border-border">
            <Button className="w-full" variant="danger" onClick={() => onDeactivate(s._id)} loading={deactivatingId === s._id}>
              Deactivate Staff
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}