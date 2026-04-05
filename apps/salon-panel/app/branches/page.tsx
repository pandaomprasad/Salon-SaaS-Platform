"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import apiClient from "@/lib/api-client";
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
  CalendarDays,
} from "lucide-react";

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
  return new Date(dateStr).toLocaleDateString("en-IN", {
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
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const salonId = decoded?.salonId || "";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchBranches = useCallback(async () => {
    if (!salonId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/salons/${salonId}/branches`);
      setBranches([...(data.data?.branches || [])]);
    } catch {
      setError("Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const filtered = branches.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.address.city.toLowerCase().includes(q) ||
      b.address.state.toLowerCase().includes(q)
    );
  });

  return (
    <ProtectedRoute page="branches">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display">Branches</h2>
            <p className="text-sm text-ash mt-1">
              {loading ? "Loading..." : `${filtered.length} branches`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={fetchBranches}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => setShowAddModal(true)}
            >
              Add Branch
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <Input
            placeholder="Search by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-4 py-3">
            <AlertCircle size={14} />
            <p className="text-sm">{error}</p>
            <Button size="sm" variant="ghost" onClick={fetchBranches}>
              Retry
            </Button>
          </div>
        )}

        {/* Branch Cards */}
        {loading ? (
          <div className="text-center text-ash py-12 text-sm">Loading branches...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-ash py-12 text-sm">No branches found.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((b) => (
              <div
                key={b._id}
                onClick={() => setSelectedBranch(b)}
                className={`bg-white border rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md ${b.isActive ? "border-smoke" : "border-red-200 opacity-60"
                  }`}
              >
                {/* Name + status */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">{b.name}</h3>
                      {!b.isActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ash mt-0.5">
                      {b.address.city}, {b.address.state}
                    </p>
                  </div>
                  <div className="text-[10px] text-ash bg-smoke px-2 py-1 rounded-lg">
                    {b.slotDurationMinutes}min slots
                  </div>
                </div>

                {/* Details grid */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-ash">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">
                      {b.address.street}, {b.address.city} – {b.address.pincode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ash">
                    <Phone size={12} className="shrink-0" />
                    <span>{b.contactPhone}</span>
                  </div>
                  {b.contactEmail && (
                    <div className="flex items-center gap-2 text-xs text-ash">
                      <Mail size={12} className="shrink-0" />
                      <span className="truncate">{b.contactEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-ash">
                    <Clock size={12} className="shrink-0" />
                    <span>{getTimings(b.workingHours)} · {getOpenDays(b.workingHours)}</span>
                  </div>
                  {b.managerId && (
                    <div className="flex items-center gap-2 text-xs text-ash">
                      <Users size={12} className="shrink-0" />
                      <span>Manager: {b.managerId.name}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-smoke/60 text-[11px] text-ash">
                  Created {formatDate(b.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Branch Detail Drawer */}
        {selectedBranch && (
          <BranchDrawer
            branch={selectedBranch}
            salonId={salonId}
            onUpdate={async () => {
              setSelectedBranch(null);
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
              fetchBranches();
            }}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// ── Branch Detail Drawer ──

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

  // Fetch managers for this branch when assign is opened
  useEffect(() => {
    if (!showAssign) return;

    async function fetchManagers() {
      setLoadingManagers(true);
      try {
        const { data } = await apiClient.get(`/branches/${b._id}/staff`);
        const staff = data.data?.staff || [];
        const mgrs = staff.filter((s: any) => s.role?.name === "manager" && s.isActive);
        setManagers(mgrs);
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
      const res = await apiClient.patch(`/salons/${salonId}/branches/${b._id}`, {
        managerId: selectedManagerId,
      });
      console.log("Assign response:", res.data);
      setShowAssign(false);
      onUpdate();
    } catch (err: any) {
      console.error("Assign error:", err.response?.data || err.message);
      setAssignError(err.response?.data?.message || "Failed to assign manager");
    } finally {
      setAssigning(false);
    }
  }
  const [editingHours, setEditingHours] = useState(false);
  const [editHours, setEditHours] = useState(
    b.workingHours.map((wh) => ({
      day: wh.day,
      isOpen: wh.isOpen,
      openTime: wh.openTime,
      closeTime: wh.closeTime,
    })),
  );
  const [savingHours, setSavingHours] = useState(false);
  const [hoursError, setHoursError] = useState<string | null>(null);

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
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-end p-6"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-lg">{b.name}</h3>
            <p className="text-xs text-ash mt-0.5">
              {b.address.city}, {b.address.state}
            </p>
          </div>
          <button onClick={onClose} className="text-ash hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm">
          {[
            ["Status", b.isActive ? "Active" : "Inactive"],
            ["Address", `${b.address.street}, ${b.address.city}, ${b.address.state} – ${b.address.pincode}`],
            ["Phone", b.contactPhone],
            ["Email", b.contactEmail || "—"],
            ["Slot Duration", `${b.slotDurationMinutes} minutes`],
            ["Advance Booking", `${b.advanceBookingDays} days`],
            ["Created", formatDate(b.createdAt)],
          ].map(([key, val]) => (
            <div key={key} className="flex justify-between gap-4">
              <span className="text-ash shrink-0">{key}</span>
              <span className="font-medium text-right">{val}</span>
            </div>
          ))}
        </div>

        {/* Manager Section */}
        <div className="mt-5 border border-smoke rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-ash uppercase tracking-wide">
              Branch Manager
            </p>
            <button
              onClick={() => setShowAssign(!showAssign)}
              className="text-[11px] font-medium text-gold hover:text-gold/80 transition-colors"
            >
              {showAssign ? "Cancel" : b.managerId ? "Change" : "Assign"}
            </button>
          </div>

          {!showAssign ? (
            b.managerId ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-smoke text-ink flex items-center justify-center text-xs font-semibold">
                  {b.managerId.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{b.managerId.name}</p>
                  <p className="text-[11px] text-ash">{b.managerId.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ash">No manager assigned</p>
            )
          ) : (
            <div className="space-y-3">
              {loadingManagers ? (
                <p className="text-xs text-ash">Loading managers...</p>
              ) : managers.length === 0 ? (
                <div className="text-xs text-ash">
                  <p>No managers found for this branch.</p>
                  <p className="mt-1">
                    Go to <span className="font-medium">Staff</span> → Add a staff member with role
                    <span className="font-medium"> Manager</span> first.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {managers.map((m) => (
                      <button
                        key={m._id}
                        onClick={() => setSelectedManagerId(m._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${selectedManagerId === m._id
                          ? "bg-ink text-white"
                          : "bg-smoke/50 hover:bg-smoke text-ink"
                          }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold ${selectedManagerId === m._id
                            ? "bg-white/15 text-white"
                            : "bg-white text-ink"
                            }`}
                        >
                          {m.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.name}</p>
                          <p
                            className={`text-[11px] ${selectedManagerId === m._id ? "text-white/60" : "text-ash"
                              }`}
                          >
                            {m.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={handleAssignManager}
                    loading={assigning}
                    disabled={!selectedManagerId}
                  >
                    Assign Manager
                  </Button>
                </>
              )}
              {assignError && (
                <p className="text-xs text-red-500">{assignError}</p>
              )}
            </div>
          )}
        </div>

        {/* Working Hours */}
        {/* Working Hours */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-ash uppercase tracking-wide">
              Working Hours
            </p>
            <button
              onClick={() => setEditingHours(!editingHours)}
              className="text-[11px] font-medium text-gold hover:text-gold/80 transition-colors"
            >
              {editingHours ? "Cancel" : "Edit"}
            </button>
          </div>

          {!editingHours ? (
            <div className="space-y-1.5">
              {b.workingHours.map((wh) => (
                <div
                  key={wh.day}
                  className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${wh.isOpen ? "bg-white" : "bg-smoke/50"
                    }`}
                >
                  <span className={`font-medium ${wh.isOpen ? "text-ink" : "text-ash"}`}>
                    {DAY_NAMES[wh.day]}
                  </span>
                  {wh.isOpen ? (
                    <span className="text-ash">
                      {wh.openTime} – {wh.closeTime}
                    </span>
                  ) : (
                    <span className="text-xs text-red-400">Closed</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {editHours.map((wh) => (
                <div
                  key={wh.day}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${wh.isOpen ? "bg-white" : "bg-smoke/30"
                    }`}
                >
                  <span className={`text-xs font-semibold w-8 ${wh.isOpen ? "text-ink" : "text-ash"}`}>
                    {DAY_NAMES[wh.day]}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditHours((prev) =>
                        prev.map((h) =>
                          h.day === wh.day ? { ...h, isOpen: !h.isOpen } : h,
                        ),
                      )
                    }
                    className={`relative w-8 h-[18px] rounded-full transition-colors shrink-0 ${wh.isOpen ? "bg-ink" : "bg-silver"
                      }`}
                  >
                    <span
                      className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform ${wh.isOpen ? "left-[14px]" : "left-[2px]"
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
                            prev.map((h) =>
                              h.day === wh.day ? { ...h, openTime: e.target.value } : h,
                            ),
                          )
                        }
                        className="border border-smoke rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:border-silver"
                      />
                      <span className="text-[10px] text-ash">to</span>
                      <input
                        type="time"
                        value={wh.closeTime}
                        onChange={(e) =>
                          setEditHours((prev) =>
                            prev.map((h) =>
                              h.day === wh.day ? { ...h, closeTime: e.target.value } : h,
                            ),
                          )
                        }
                        className="border border-smoke rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:border-silver"
                      />
                    </div>
                  ) : (
                    <span className="text-[11px] text-red-400">Closed</span>
                  )}
                </div>
              ))}

              {hoursError && (
                <p className="text-xs text-red-500 mt-1">{hoursError}</p>
              )}

              <Button
                className="w-full mt-2"
                size="sm"
                onClick={handleSaveHours}
                loading={savingHours}
              >
                Save Working Hours
              </Button>
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
    isOpen: i !== 0, // Sunday closed by default
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

  const [workingHours, setWorkingHours] = useState(defaultHours);
  const [fieldErrors, setFieldErrors] = useState<{ field: string; message: string }[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => prev.filter((e) => !e.field.includes(key)));
    setServerError(null);
  }

  function getError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field || e.field === `address.${field}`)?.message;
  }

  function updateHour(dayIndex: number, key: string, value: string | boolean) {
    setWorkingHours((prev) =>
      prev.map((wh) =>
        wh.day === dayIndex ? { ...wh, [key]: value } : wh,
      ),
    );
  }

  async function handleSubmit() {
    const errors: { field: string; message: string }[] = [];
    if (!form.name.trim()) errors.push({ field: "name", message: "Branch name is required" });
    if (!form.street.trim()) errors.push({ field: "address.street", message: "Street is required" });
    if (!form.city.trim()) errors.push({ field: "address.city", message: "City is required" });
    if (!form.state.trim()) errors.push({ field: "address.state", message: "State is required" });
    if (!form.pincode.trim()) errors.push({ field: "address.pincode", message: "Pincode is required" });
    if (!form.contactPhone.trim()) errors.push({ field: "contactPhone", message: "Phone is required" });

    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setServerError(null);
    setFieldErrors([]);

    try {
      await apiClient.post(`/salons/${salonId}/branches`, {
        name: form.name.trim(),
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
        },
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim() || undefined,
        slotDurationMinutes: parseInt(form.slotDurationMinutes) || 60,
        workingHours,
      });
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
    <Modal title="Add New Branch" onClose={onClose} width="max-w-xl">
      <div
        className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-paper rounded-2xl w-full max-w-2xl shadow-2xl animate-slide-up flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-smoke shrink-0">
            <h3 className="font-semibold text-base">Add New Branch</h3>
            <button onClick={onClose} className="text-ash hover:text-ink transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {/* Branch Name */}
            <Input
              label="Branch Name"
              placeholder="e.g. Bandra West"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              error={getError("name")}
            />

            {/* Address */}
            <div className="border border-smoke rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-ash">Address</p>
              <Input
                placeholder="Street address"
                value={form.street}
                onChange={(e) => set("street", e.target.value)}
                error={getError("street")}
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  error={getError("city")}
                />
                <Input
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  error={getError("state")}
                />
                <Input
                  placeholder="Pincode"
                  value={form.pincode}
                  onChange={(e) => set("pincode", e.target.value)}
                  error={getError("pincode")}
                />
              </div>
            </div>

            {/* Contact + Slot */}
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Phone"
                placeholder="+91-9000000000"
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                error={getError("contactPhone")}
              />
              <Input
                label="Email"
                type="email"
                placeholder="branch@salon.com"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
              <Input
                label="Slot (min)"
                type="number"
                placeholder="60"
                value={form.slotDurationMinutes}
                onChange={(e) => set("slotDurationMinutes", e.target.value)}
              />
            </div>

            {/* Working Hours */}
            <div className="border border-smoke rounded-xl p-4">
              <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-ash mb-3">
                Working Hours
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {workingHours.map((wh) => (
                  <div
                    key={wh.day}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${wh.isOpen ? "bg-white" : "bg-smoke/30"
                      }`}
                  >
                    <span className={`text-xs font-semibold w-8 ${wh.isOpen ? "text-ink" : "text-ash"}`}>
                      {DAY_NAMES[wh.day]}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateHour(wh.day, "isOpen", !wh.isOpen)}
                      className={`relative w-8 h-[18px] rounded-full transition-colors shrink-0 ${wh.isOpen ? "bg-ink" : "bg-silver"
                        }`}
                    >
                      <span
                        className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform ${wh.isOpen ? "left-[14px]" : "left-[2px]"
                          }`}
                      />
                    </button>
                    {wh.isOpen ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="time"
                          value={wh.openTime}
                          onChange={(e) => updateHour(wh.day, "openTime", e.target.value)}
                          className="border border-smoke rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:border-silver"
                        />
                        <span className="text-[10px] text-ash">to</span>
                        <input
                          type="time"
                          value={wh.closeTime}
                          onChange={(e) => updateHour(wh.day, "closeTime", e.target.value)}
                          className="border border-smoke rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:border-silver"
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-red-400">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Errors */}
            {serverError && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="shrink-0" />
                <p className="text-xs">{serverError}</p>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-smoke shrink-0">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} loading={saving}>
              Create Branch
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}