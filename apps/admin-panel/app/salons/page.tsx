"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import { Search, Plus, Building2, Users, GitBranch, AlertCircle, RefreshCw, X, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Salon {
  _id: string;
  name: string;
  description: string;
  owner: { _id: string; name: string; email: string; phone: string } | null;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  branchCount: number;
  staffCount: number;
  createdAt: string;
}

export default function SalonsPage() {
  const router = useRouter();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");


  const fetchSalons = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/salons");
      setSalons(data.data?.salons || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSalons(); }, [fetchSalons]);

  const filtered = salons.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.owner?.name?.toLowerCase().includes(search.toLowerCase()) || false
  );

  async function toggleSalon(id: string, isActive: boolean) {
    if (isActive) {
      // Show reason modal
      setDeactivateId(id);
      setDeactivateReason("");
      return;
    }
    // Reactivating
    try {
      await apiClient.patch(`/admin/salons/${id}`, { isActive: true });
      fetchSalons();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed");
    }
  }

  async function confirmDeactivate() {
    if (!deactivateId) return;
    try {
      await apiClient.delete(`/admin/salons/${deactivateId}`, {
        data: { reason: deactivateReason || "Deactivated by platform admin" },
      });
      setDeactivateId(null);
      fetchSalons();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Salons</h1>
          <p className="text-[13px] text-muted mt-1">{filtered.length} salons on platform</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSalons} className="px-3 py-2 text-[12px] text-slate hover:text-ink bg-white border border-border rounded-lg flex items-center gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="px-3 py-2 text-[12px] text-white bg-accent rounded-lg flex items-center gap-1.5 hover:bg-accent/90">
            <Plus size={13} /> Create Salon
          </button>
        </div>
      </div>

      <div className="max-w-md relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search salons or owners..."
          className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
      </div>

      {loading ? (
        <p className="text-center text-muted py-12 text-[13px]">Loading salons...</p>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-subtle">
                {["Salon", "Owner", "Branches", "Staff", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left font-medium text-slate px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id} className="border-b border-border/50 hover:bg-subtle/50 transition-colors cursor-pointer" onClick={() => router.push(`/salons/${s._id}`)}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-[11px] text-muted">{s.contactEmail}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate">{s.owner?.name || "—"}</td>
                  <td className="px-5 py-3.5 text-slate">{s.branchCount}</td>
                  <td className="px-5 py-3.5 text-slate">{s.staffCount}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${s.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleSalon(s._id, s.isActive)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${s.isActive ? "text-danger bg-danger/5 hover:bg-danger/10" : "text-success bg-success/5 hover:bg-success/10"
                        }`}
                    >
                      {s.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateSalonModal onSuccess={() => { setShowCreate(false); fetchSalons(); }} onClose={() => setShowCreate(false)} />}
      {deactivateId && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setDeactivateId(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl border border-border animate-slide-up p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-[15px] text-danger mb-2">Deactivate Salon</h3>
            <p className="text-[13px] text-muted mb-4">This will deactivate the salon and all its branches. Customers won't be able to make bookings.</p>
            <textarea
              placeholder="Reason for deactivation (shown to salon owner)..."
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-danger resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setDeactivateId(null)} className="flex-1 py-2 text-[13px] font-medium bg-white border border-border rounded-lg hover:bg-subtle">Cancel</button>
              <button onClick={confirmDeactivate} className="flex-1 py-2 text-[13px] font-medium text-white bg-danger rounded-lg hover:bg-danger/90">Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateSalonModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1 — Salon + Owner
  const [form, setForm] = useState({
    salonName: "", description: "",
    ownerName: "", ownerEmail: "", ownerPhone: "", ownerPassword: "",
  });

  // Step 2 — Branch
  const [addBranch, setAddBranch] = useState(true);
  const [branch, setBranch] = useState({
    name: "", street: "", city: "", state: "", pincode: "",
    contactPhone: "", contactEmail: "", slotDurationMinutes: "60",
  });

  // Step 3 — Working Hours
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [workingHours, setWorkingHours] = useState(
    DAY_NAMES.map((_, i) => ({ day: i, isOpen: i !== 0, openTime: "09:00", closeTime: "21:00" })),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ salonId: string; salonName: string; branchCreated: boolean } | null>(null);

  function setF(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); setError(""); }
  function setB(k: string, v: string) { setBranch((p) => ({ ...p, [k]: v })); setError(""); }

  function validateStep(): boolean {
    if (step === 1) {
      if (!form.salonName.trim()) { setError("Salon name is required"); return false; }
      if (!form.ownerName.trim()) { setError("Owner name is required"); return false; }
      if (!form.ownerEmail.trim()) { setError("Owner email is required"); return false; }
      if (!form.ownerPassword) { setError("Owner password is required"); return false; }
      if (form.ownerPassword.length < 8) { setError("Password must be at least 8 characters"); return false; }
    }
    if (step === 2 && addBranch) {
      if (!branch.name.trim()) { setError("Branch name is required"); return false; }
      if (!branch.city.trim()) { setError("City is required"); return false; }
      if (!branch.contactPhone.trim()) { setError("Branch phone is required"); return false; }
    }
    return true;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (step === 2 && !addBranch) {
      handleSubmit();
      return;
    }
    if (step < totalSteps) setStep(step + 1);
    else handleSubmit();
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      // Step 1 — Create salon + owner
      const { data: salonData } = await apiClient.post("/admin/salons", {
        salonName: form.salonName.trim(),
        description: form.description.trim(),
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim().toLowerCase(),
        ownerPhone: form.ownerPhone.trim(),
        ownerPassword: form.ownerPassword,
      });

      const salonId = salonData.data?.salon?._id;
      const ownerId = salonData.data?.owner?._id;
      let branchCreated = false;

      // Step 2 — Create branch (if opted in)
      if (addBranch && salonId) {
        try {
          // Need to login as owner to create branch (admin can't create branches directly via salon routes)
          // Instead, use admin endpoint — let's create branch via admin
          const { data: ownerLoginData } = await apiClient.post("/auth/login", {
            email: form.ownerEmail.trim().toLowerCase(),
            password: form.ownerPassword,
          });

          const ownerToken = ownerLoginData.data?.accessToken;

          if (ownerToken) {
            await axios.post(
              `${apiClient.defaults.baseURL}/salons/${salonId}/branches`,
              {
                name: branch.name.trim(),
                address: {
                  street: branch.street.trim() || branch.name.trim(),
                  city: branch.city.trim(),
                  state: branch.state.trim() || branch.city.trim(),
                  pincode: branch.pincode.trim() || "000000",
                },
                contactPhone: branch.contactPhone.trim(),
                contactEmail: branch.contactEmail.trim() || undefined,
                slotDurationMinutes: parseInt(branch.slotDurationMinutes) || 60,
                workingHours,
              },
              { headers: { Authorization: `Bearer ${ownerToken}` } },
            );
            branchCreated = true;
          }
        } catch (branchErr: any) {
          console.error("Branch creation failed:", branchErr.response?.data?.message);
          // Don't fail the whole flow — salon + owner are created
        }
      }

      setResult({
        salonId: salonId || "",
        salonName: form.salonName.trim(),
        branchCreated,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create salon");
    } finally {
      setSaving(false);
    }
  }

  // Success screen
  if (result) {
    return (
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
        <div className="bg-white rounded-xl w-full max-w-md shadow-xl border border-border animate-slide-up p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} />
          </div>
          <h3 className="text-lg font-semibold text-ink">Salon Created!</h3>
          <p className="text-[13px] text-muted mt-2">
            <span className="font-medium text-ink">{result.salonName}</span> has been set up
            {result.branchCreated ? " with its first branch" : ""}.
          </p>
          <div className="mt-4 bg-subtle rounded-lg p-3 text-[12px] text-left space-y-1">
            <p><span className="text-muted">Owner login:</span> <span className="font-medium">{form.ownerEmail}</span></p>
            <p><span className="text-muted">Password:</span> <span className="font-medium">{form.ownerPassword}</span></p>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onSuccess} className="flex-1 py-2.5 text-[13px] font-medium text-white bg-accent rounded-lg hover:bg-accent/90">
              Done
            </button>
            <button onClick={() => router.push(`/salons/${result.salonId}`)} className="flex-1 py-2.5 text-[13px] font-medium bg-white border border-border rounded-lg hover:bg-subtle">
              View Salon
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-xl shadow-xl border border-border animate-slide-up flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="font-semibold text-[15px]">Create New Salon</h3>
            <p className="text-[11px] text-muted mt-0.5">Step {step} of {addBranch ? totalSteps : 2}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink p-1 rounded-md hover:bg-subtle">
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-1.5">
            {Array.from({ length: addBranch ? totalSteps : 2 }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-accent" : "bg-border"}`} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              <p className="text-[12px] font-semibold text-slate uppercase tracking-wider">Salon Details</p>
              <input placeholder="Salon Name *" value={form.salonName} onChange={(e) => setF("salonName", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
              <input placeholder="Description" value={form.description} onChange={(e) => setF("description", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />

              <p className="text-[12px] font-semibold text-slate uppercase tracking-wider pt-2">Owner Account</p>
              <input placeholder="Owner Name *" value={form.ownerName} onChange={(e) => setF("ownerName", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Email *" value={form.ownerEmail} onChange={(e) => setF("ownerEmail", e.target.value)}
                  className="border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
                <input placeholder="Phone" value={form.ownerPhone} onChange={(e) => setF("ownerPhone", e.target.value)}
                  className="border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
              </div>
              <input type="password" placeholder="Password * (min 8 chars)" value={form.ownerPassword} onChange={(e) => setF("ownerPassword", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-slate uppercase tracking-wider">First Branch</p>
                <button onClick={() => setAddBranch(!addBranch)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${addBranch ? "bg-accent" : "bg-border"}`}>
                  <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white transition-transform ${addBranch ? "left-[17px]" : "left-[3px]"}`} />
                </button>
              </div>

              {addBranch ? (
                <>
                  <p className="text-[11px] text-muted">Set up the first branch for this salon</p>
                  <input placeholder="Branch Name *" value={branch.name} onChange={(e) => setB("name", e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="City *" value={branch.city} onChange={(e) => setB("city", e.target.value)}
                      className="border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
                    <input placeholder="State" value={branch.state} onChange={(e) => setB("state", e.target.value)}
                      className="border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Street Address" value={branch.street} onChange={(e) => setB("street", e.target.value)}
                      className="border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
                    <input placeholder="Pincode" value={branch.pincode} onChange={(e) => setB("pincode", e.target.value)}
                      className="border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input placeholder="Phone *" value={branch.contactPhone} onChange={(e) => setB("contactPhone", e.target.value)}
                      className="border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
                    <input placeholder="Email" value={branch.contactEmail} onChange={(e) => setB("contactEmail", e.target.value)}
                      className="border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
                    <input type="number" placeholder="Slot (min)" value={branch.slotDurationMinutes} onChange={(e) => setB("slotDurationMinutes", e.target.value)}
                      className="border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-accent" />
                  </div>
                </>
              ) : (
                <div className="bg-subtle rounded-lg p-4 text-center">
                  <p className="text-[13px] text-muted">You can add branches later from the salon detail page.</p>
                </div>
              )}
            </>
          )}

          {step === 3 && addBranch && (
            <>
              <p className="text-[12px] font-semibold text-slate uppercase tracking-wider">Working Hours</p>
              <p className="text-[11px] text-muted">Set the operating hours for {branch.name || "the branch"}</p>
              <div className="space-y-1.5">
                {workingHours.map((wh) => (
                  <div key={wh.day} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${wh.isOpen ? "bg-white border border-border" : "bg-subtle"}`}>
                    <span className={`text-[12px] font-semibold w-8 ${wh.isOpen ? "text-ink" : "text-muted"}`}>{DAY_NAMES[wh.day]}</span>
                    <button type="button"
                      onClick={() => setWorkingHours((p) => p.map((h) => h.day === wh.day ? { ...h, isOpen: !h.isOpen } : h))}
                      className={`relative w-8 h-[18px] rounded-full transition-colors shrink-0 ${wh.isOpen ? "bg-accent" : "bg-border"}`}>
                      <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform ${wh.isOpen ? "left-[14px]" : "left-[2px]"}`} />
                    </button>
                    {wh.isOpen ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input type="time" value={wh.openTime}
                          onChange={(e) => setWorkingHours((p) => p.map((h) => h.day === wh.day ? { ...h, openTime: e.target.value } : h))}
                          className="border border-border rounded-lg px-2 py-1 text-[12px] bg-white focus:outline-none focus:border-accent" />
                        <span className="text-[10px] text-muted">to</span>
                        <input type="time" value={wh.closeTime}
                          onChange={(e) => setWorkingHours((p) => p.map((h) => h.day === wh.day ? { ...h, closeTime: e.target.value } : h))}
                          className="border border-border rounded-lg px-2 py-1 text-[12px] bg-white focus:outline-none focus:border-accent" />
                      </div>
                    ) : (
                      <span className="text-[11px] text-danger">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-danger bg-danger/5 rounded-lg px-3 py-2.5">
              <AlertCircle size={13} /><p className="text-[12px]">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-2.5 text-[13px] font-medium bg-white border border-border rounded-lg hover:bg-subtle">
              Back
            </button>
          ) : (
            <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-medium bg-white border border-border rounded-lg hover:bg-subtle">
              Cancel
            </button>
          )}
          <button onClick={handleNext} disabled={saving}
            className="flex-1 py-2.5 text-[13px] font-medium text-white bg-accent rounded-lg hover:bg-accent/90 disabled:opacity-50">
            {saving ? "Creating..." : step === (addBranch ? totalSteps : 2) ? "Create Salon" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}