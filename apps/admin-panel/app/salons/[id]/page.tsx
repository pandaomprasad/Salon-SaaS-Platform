"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, Clock, Users,
  UserCog, GitBranch, RefreshCw, Pencil, Save, X, AlertCircle,
} from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Salon {
  _id: string;
  name: string;
  description: string;
  owner: { _id: string; name: string; email: string; phone: string } | null;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: string;
}

interface Branch {
  _id: string;
  name: string;
  address: { street: string; city: string; state: string; pincode: string };
  contactPhone: string;
  contactEmail: string;
  workingHours: { day: number; isOpen: boolean; openTime: string; closeTime: string }[];
  slotDurationMinutes: number;
  managerId: { _id: string; name: string; email: string } | null;
  isActive: boolean;
}

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: { name: string } | null;
  branchId: { name: string } | null;
  isActive: boolean;
  createdAt: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function SalonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const salonId = params.id as string;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", contactEmail: "", contactPhone: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deactivateBranchId, setDeactivateBranchId] = useState<string | null>(null);
  const [branchDeactivateReason, setBranchDeactivateReason] = useState("");

  async function fetchAll() {
    setLoading(true);
    try {
      const [salonRes, staffRes] = await Promise.all([
        apiClient.get(`/admin/salons/${salonId}`),
        apiClient.get(`/admin/salons/${salonId}/staff`),
      ]);
      setSalon(salonRes.data.data?.salon || null);
      setBranches(salonRes.data.data?.branches || []);
      setStaff(staffRes.data.data?.staff || []);
    } catch { } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, [salonId]);

  function startEdit() {
    if (!salon) return;
    setEditForm({
      name: salon.name,
      description: salon.description || "",
      contactEmail: salon.contactEmail || "",
      contactPhone: salon.contactPhone || "",
    });
    setEditing(true);
    setSaveError("");
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await apiClient.patch(`/admin/salons/${salonId}`, editForm);
      setEditing(false);
      fetchAll();
    } catch (err: any) {
      setSaveError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBranch(branchId: string, isActive: boolean) {
    if (isActive) {
      setDeactivateBranchId(branchId);
      setBranchDeactivateReason("");
      return;
    }
    // Reactivate
    try {
      await apiClient.patch(`/admin/salons/${salonId}/branches/${branchId}`, {
        isActive: true,
        deactivatedByAdmin: false,
        adminDeactivationReason: null,
      });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to activate branch");
    }
  }

  async function confirmDeactivateBranch() {
    if (!deactivateBranchId) return;
    try {
      await apiClient.patch(`/admin/salons/${salonId}/branches/${deactivateBranchId}`, {
        isActive: false,
        deactivatedByAdmin: true,
        adminDeactivationReason: branchDeactivateReason || "Deactivated by platform admin",
        adminDeactivatedAt: new Date().toISOString(),
      });
      setDeactivateBranchId(null);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to deactivate branch");
    }
  }

  if (loading) return <div className="text-center text-muted py-20 text-[13px]">Loading salon details...</div>;
  if (!salon) return <div className="text-center text-muted py-20 text-[13px]">Salon not found.</div>;

  const managers = staff.filter((s) => s.role?.name === "manager");
  const staffMembers = staff.filter((s) => s.role?.name === "staff");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/salons")} className="p-2 rounded-lg hover:bg-white text-slate hover:text-ink transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-ink">{salon.name}</h1>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${salon.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
              {salon.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-[13px] text-muted mt-0.5">{salon.description || "No description"}</p>
        </div>
        <button onClick={fetchAll} className="px-3 py-2 text-[12px] text-slate hover:text-ink bg-white border border-border rounded-lg flex items-center gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Salon Info + Edit */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold">Salon Information</h2>
          {!editing ? (
            <button onClick={startEdit} className="text-[12px] text-accent hover:text-accent/80 flex items-center gap-1">
              <Pencil size={12} /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="text-[12px] text-muted hover:text-ink flex items-center gap-1">
                <X size={12} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="text-[12px] text-accent hover:text-accent/80 flex items-center gap-1">
                <Save size={12} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            {[
              ["Name", salon.name],
              ["Description", salon.description || "—"],
              ["Email", salon.contactEmail || "—"],
              ["Phone", salon.contactPhone || "—"],
              ["Owner", salon.owner?.name || "—"],
              ["Owner Email", salon.owner?.email || "—"],
              ["Created", formatDate(salon.createdAt)],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[11px] text-muted mb-0.5">{k}</p>
                <p className="font-medium">{v}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-slate block mb-1">Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate block mb-1">Description</label>
                <input value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate block mb-1">Email</label>
                <input value={editForm.contactEmail} onChange={(e) => setEditForm((p) => ({ ...p, contactEmail: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate block mb-1">Phone</label>
                <input value={editForm.contactPhone} onChange={(e) => setEditForm((p) => ({ ...p, contactPhone: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-accent" />
              </div>
            </div>
            {saveError && (
              <div className="flex items-center gap-2 text-danger bg-danger/5 rounded-lg px-3 py-2">
                <AlertCircle size={13} /><p className="text-[12px]">{saveError}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <MiniStat icon={<GitBranch size={14} />} label="Branches" value={branches.length} color="bg-blue-500" />
        <MiniStat icon={<UserCog size={14} />} label="Managers" value={managers.length} color="bg-amber-500" />
        <MiniStat icon={<Users size={14} />} label="Staff" value={staffMembers.length} color="bg-emerald-500" />
        <MiniStat icon={<Building2 size={14} />} label="Total Team" value={staff.length} color="bg-purple-500" />
      </div>

      {/* Branches */}
      <div className="bg-white border border-border rounded-xl">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold">Branches</h2>
          <p className="text-[12px] text-muted mt-0.5">{branches.length} locations</p>
        </div>
        {branches.length === 0 ? (
          <p className="text-[13px] text-muted py-8 text-center">No branches yet.</p>
        ) : (
          <div className="divide-y divide-border/50">
            {branches.map((b) => (
              <div key={b._id} className="px-6 py-4 hover:bg-subtle/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-medium">{b.name}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${b.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                        {b.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[12px] text-slate">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {b.address.city}, {b.address.state}</span>
                      <span className="flex items-center gap-1"><Phone size={11} /> {b.contactPhone}</span>
                      {b.contactEmail && <span className="flex items-center gap-1"><Mail size={11} /> {b.contactEmail}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-start gap-3">
                    <div>
                      <p className="text-[11px] text-muted">{b.slotDurationMinutes}min slots</p>
                      {b.managerId && <p className="text-[11px] text-slate mt-0.5">Mgr: {b.managerId.name}</p>}
                    </div>
                    <button
                      onClick={() => handleToggleBranch(b._id, b.isActive)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${b.isActive ? "text-danger bg-danger/5 hover:bg-danger/10" : "text-success bg-success/5 hover:bg-success/10"
                        }`}
                    >
                      {b.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
                {/* Working hours compact */}
                <div className="flex gap-1.5 mt-3">
                  {b.workingHours.map((wh) => (
                    <div key={wh.day} className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${wh.isOpen ? "bg-success/10 text-success" : "bg-subtle text-muted"}`}>
                      {DAY_NAMES[wh.day]}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Staff */}
      <div className="bg-white border border-border rounded-xl">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold">Staff & Managers</h2>
          <p className="text-[12px] text-muted mt-0.5">{staff.length} team members</p>
        </div>
        {staff.length === 0 ? (
          <p className="text-[13px] text-muted py-8 text-center">No staff members yet.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-subtle">
                {["Name", "Email", "Phone", "Role", "Branch", "Status"].map((h) => (
                  <th key={h} className="text-left font-medium text-slate px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s._id} className="border-b border-border/50 hover:bg-subtle/50">
                  <td className="px-6 py-3 font-medium">{s.name}</td>
                  <td className="px-6 py-3 text-slate">{s.email}</td>
                  <td className="px-6 py-3 text-slate">{s.phone || "—"}</td>
                  <td className="px-6 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md capitalize ${s.role?.name === "manager" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                      }`}>{s.role?.name || "—"}</span>
                  </td>
                  <td className="px-6 py-3 text-slate">{s.branchId?.name || "—"}</td>
                  <td className="px-6 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${s.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {deactivateBranchId && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setDeactivateBranchId(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl border border-border animate-slide-up p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-[15px] text-danger mb-2">Deactivate Branch</h3>
            <p className="text-[13px] text-muted mb-4">This branch will stop receiving bookings. Customers won't see it in search results.</p>
            <textarea
              placeholder="Reason for deactivation..."
              value={branchDeactivateReason}
              onChange={(e) => setBranchDeactivateReason(e.target.value)}
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-danger resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setDeactivateBranchId(null)} className="flex-1 py-2 text-[13px] font-medium bg-white border border-border rounded-lg hover:bg-subtle">Cancel</button>
              <button onClick={confirmDeactivateBranch} className="flex-1 py-2 text-[13px] font-medium text-white bg-danger rounded-lg hover:bg-danger/90">Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${color} text-white flex items-center justify-center`}>{icon}</div>
      <div>
        <p className="text-xl font-semibold">{value}</p>
        <p className="text-[11px] text-muted">{label}</p>
      </div>
    </div>
  );
}