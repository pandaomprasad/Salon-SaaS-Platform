"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Users,
  UserCog,
  GitBranch,
  RefreshCw,
  Pencil,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  User,
} from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Salon {
  _id: string;
  name: string;
  description?: string;
  owner?: { _id: string; name: string; email: string; phone?: string } | null;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  deactivatedByAdmin?: boolean;
  adminDeactivationReason?: string;
  createdAt: string;
}

interface Branch {
  _id: string;
  name: string;
  address?: { street?: string; city?: string; state?: string; pincode?: string };
  contactPhone?: string;
  contactEmail?: string;
  workingHours?: { day: number; isOpen: boolean; openTime: string; closeTime: string }[];
  slotDurationMinutes?: number;
  managerId?: { _id: string; name: string; email: string } | null;
  isActive?: boolean;
}

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: { name: string } | null;
  branchId?: { name: string } | null;
  isActive?: boolean;
  createdAt?: string;
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SalonDetailsView({
  salonId,
  onBack,
}: {
  salonId: string;
  onBack: () => void;
}) {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const [deactivateBranchId, setDeactivateBranchId] = useState<string | null>(null);
  const [branchDeactivateReason, setBranchDeactivateReason] = useState("");
  const [togglingBranch, setTogglingBranch] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [salonRes, staffRes] = await Promise.allSettled([
        apiClient.get(`/admin/salons/${salonId}`),
        apiClient.get(`/admin/salons/${salonId}/staff`),
      ]);

      if (salonRes.status === "fulfilled") {
        const sData = salonRes.value.data?.data;
        setSalon(sData?.salon || sData || null);
        setBranches(sData?.branches || []);
      }

      if (staffRes.status === "fulfilled") {
        setStaff(staffRes.value.data?.data?.staff || staffRes.value.data?.data || []);
      }
    } catch (err) {
      console.error("Error fetching salon details:", err);
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function startEdit() {
    if (!salon) return;
    setEditForm({
      name: salon.name || "",
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
      setSaveError(err.response?.data?.message || "Failed to update salon information");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBranch(branchId: string, isCurrentlyActive: boolean) {
    if (isCurrentlyActive) {
      setDeactivateBranchId(branchId);
      setBranchDeactivateReason("");
      return;
    }
    // Reactivate branch
    setTogglingBranch(true);
    try {
      await apiClient.patch(`/admin/salons/${salonId}/branches/${branchId}`, {
        isActive: true,
        deactivatedByAdmin: false,
        adminDeactivationReason: null,
      });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to activate branch");
    } finally {
      setTogglingBranch(false);
    }
  }

  async function confirmDeactivateBranch() {
    if (!deactivateBranchId) return;
    setTogglingBranch(true);
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
    } finally {
      setTogglingBranch(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-20 text-center shadow-xs space-y-3">
        <RefreshCw size={32} className="animate-spin mx-auto text-indigo-600" />
        <p className="text-sm font-bold text-slate-700">Loading salon details profile...</p>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-16 text-center shadow-xs space-y-4 max-w-md mx-auto">
        <Building2 size={36} className="mx-auto text-slate-300" />
        <h3 className="text-base font-bold text-slate-800">Salon Not Found</h3>
        <p className="text-xs text-slate-500">The requested salon account could not be found or has been deleted.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
        >
          Return to Salons Network
        </button>
      </div>
    );
  }

  const isSalonActive = salon.isActive !== false && !salon.deactivatedByAdmin;
  const managers = staff.filter((s) => s.role?.name === "manager" || s.role?.name === "Manager");
  const staffMembers = staff.filter((s) => s.role?.name !== "manager" && s.role?.name !== "Manager");

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
      {/* Top Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Back to Salons"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{salon.name}</h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-extrabold border ${
                  isSalonActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {isSalonActive ? "ACTIVE NETWORK" : "DEACTIVATED"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {salon.description || "Salon business profile and branch details."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={13} className="text-indigo-600" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Salon Information Card with Inline Edit Mode */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Salon Business Profile</h2>
          </div>

          {!editing ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold border border-indigo-200/80 transition-all cursor-pointer"
            >
              <Pencil size={13} />
              <span>Edit Details</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer"
              >
                <X size={13} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Save size={13} />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                Salon Name
              </span>
              <p className="font-extrabold text-slate-900 text-sm">{salon.name}</p>
            </div>

            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                Owner Account
              </span>
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <User size={13} className="text-slate-400" />
                {salon.owner?.name || "—"}
              </p>
              {salon.owner?.email && (
                <p className="text-[10px] text-slate-400 mt-0.5">{salon.owner.email}</p>
              )}
            </div>

            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                Contact Details
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Mail size={12} className="text-slate-400" />
                {salon.contactEmail || salon.owner?.email || "—"}
              </p>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 mt-1">
                <Phone size={12} className="text-slate-400" />
                {salon.contactPhone || salon.owner?.phone || "—"}
              </p>
            </div>

            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                Registration Date
              </span>
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                {formatDate(salon.createdAt)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Salon Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editForm.contactPhone}
                  onChange={(e) => setEditForm((p) => ({ ...p, contactPhone: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs font-semibold"
                />
              </div>
            </div>

            {saveError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                <AlertCircle size={15} />
                <span>{saveError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <GitBranch size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branches</p>
            <p className="text-xl font-extrabold text-slate-900">{branches.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <UserCog size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Managers</p>
            <p className="text-xl font-extrabold text-slate-900">{managers.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff</p>
            <p className="text-xl font-extrabold text-slate-900">{staffMembers.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Team</p>
            <p className="text-xl font-extrabold text-slate-900">{staff.length}</p>
          </div>
        </div>
      </div>

      {/* Branches List Section */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Salon Branches</h2>
            <p className="text-xs text-slate-500">{branches.length} Registered Locations</p>
          </div>
        </div>

        {branches.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No branches registered yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {branches.map((b) => {
              const isBranchActive = b.isActive !== false;

              return (
                <div key={b._id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-extrabold text-slate-900">{b.name}</h3>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            isBranchActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {isBranchActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        {b.address?.street && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <MapPin size={12} className="text-slate-400" />
                            {b.address.street}, {b.address.city} {b.address.state}
                          </span>
                        )}
                        {b.contactPhone && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Phone size={12} className="text-slate-400" />
                            {b.contactPhone}
                          </span>
                        )}
                        {b.contactEmail && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Mail size={12} className="text-slate-400" />
                            {b.contactEmail}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-xs">
                        <p className="text-[11px] font-bold text-slate-400">
                          {b.slotDurationMinutes || 30} min slots
                        </p>
                        {b.managerId && (
                          <p
                            onClick={() =>
                              setSelectedStaff({
                                _id: b.managerId!._id,
                                name: b.managerId!.name,
                                email: b.managerId!.email,
                                role: { name: "Manager" },
                                branchId: { name: b.name },
                              })
                            }
                            className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer mt-0.5"
                          >
                            Mgr: {b.managerId.name}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleBranch(b._id, isBranchActive)}
                        disabled={togglingBranch}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                          isBranchActive
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {isBranchActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>

                  {/* Working hours pills */}
                  {Array.isArray(b.workingHours) && b.workingHours.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100/80">
                      {b.workingHours.map((wh) => (
                        <div
                          key={wh.day}
                          className={`text-[10px] px-2 py-0.5 rounded-lg font-extrabold border ${
                            wh.isOpen
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              : "bg-slate-100 text-slate-400 border-slate-200/60"
                          }`}
                        >
                          {DAY_NAMES[wh.day]}: {wh.isOpen ? `${wh.openTime} - ${wh.closeTime}` : "Closed"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Staff & Managers Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Staff & Manager Directory</h2>
            <p className="text-xs text-slate-500">
              {staff.length} Team Members — Click any row to view complete details
            </p>
          </div>
        </div>

        {staff.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No staff members listed for this salon.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Branch</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((s) => {
                  const isManager = s.role?.name?.toLowerCase() === "manager";

                  return (
                    <tr
                      key={s._id}
                      onClick={() => setSelectedStaff(s)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {s.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{s.email}</td>
                      <td className="px-6 py-4 text-slate-600 font-semibold font-mono">
                        {s.phone ? (s.phone.trim().length <= 7 ? "•••••••" : "•••••••" + s.phone.trim().slice(7)) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-xl font-bold text-[11px] border ${
                            isManager
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {s.role?.name || "Staff"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {s.branchId?.name || "All Branches"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                            s.isActive !== false
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {s.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff & Manager Details Modal */}
      {selectedStaff && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedStaff(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 relative overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
                  {selectedStaff.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedStaff.name}</h3>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                      selectedStaff.role?.name?.toLowerCase() === "manager"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {selectedStaff.role?.name || "Staff Member"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Member Account Status
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      selectedStaff.isActive !== false
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {selectedStaff.isActive !== false ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-200/60 text-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Email Address</span>
                      <span className="font-semibold text-slate-900">{selectedStaff.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Phone Number</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {selectedStaff.phone
                          ? selectedStaff.phone.trim().length <= 7
                            ? "•••••••"
                            : "•••••••" + selectedStaff.phone.trim().slice(7)
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Building2 size={14} className="text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Assigned Salon</span>
                      <span className="font-bold text-slate-900">{salon.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <GitBranch size={14} className="text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Branch Location</span>
                      <span className="font-bold text-slate-900">
                        {selectedStaff.branchId?.name || "All Branches"}
                      </span>
                    </div>
                  </div>

                  {selectedStaff.createdAt && (
                    <div className="flex items-center gap-2.5">
                      <Calendar size={14} className="text-indigo-600 shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Member Since</span>
                        <span className="font-semibold text-slate-800">
                          {formatDate(selectedStaff.createdAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {deactivateBranchId && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setDeactivateBranchId(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Deactivate Branch</h3>
                <p className="text-xs text-slate-500">Suspend branch operations & client bookings</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This branch will stop accepting bookings and will be hidden from customer search results.
            </p>

            <textarea
              placeholder="Reason for branch deactivation..."
              value={branchDeactivateReason}
              onChange={(e) => setBranchDeactivateReason(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 resize-none bg-slate-50"
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeactivateBranchId(null)}
                className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivateBranch}
                disabled={togglingBranch}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                {togglingBranch ? "Deactivating..." : "Confirm Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
