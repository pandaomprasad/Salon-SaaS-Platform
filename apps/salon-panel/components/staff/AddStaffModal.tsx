"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import apiClient from "@/lib/api-client";

// ── Types ──

interface AddStaffForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "staff" | "manager";
}

interface FieldError {
  field: string;
  message: string;
}

interface AddStaffModalProps {
  branchId: string;
  branchName?: string;
  allowedRoles?: ("staff" | "manager")[];
  onSuccess: (newStaff: any) => void;
  onClose: () => void;
}

// ── Validation ──

function validateForm(form: AddStaffForm): FieldError[] {
  const errors: FieldError[] = [];

  if (!form.name.trim()) {
    errors.push({ field: "name", message: "Name is required" });
  } else if (form.name.trim().length < 2 || form.name.trim().length > 50) {
    errors.push({ field: "name", message: "Name must be 2–50 characters" });
  }

  if (!form.email.trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.push({ field: "email", message: "Must be a valid email" });
  }

  if (!form.phone.trim()) {
    errors.push({ field: "phone", message: "Phone is required" });
  }

  if (!form.password) {
    errors.push({ field: "password", message: "Password is required" });
  } else {
    if (form.password.length < 8)
      errors.push({ field: "password", message: "Must be at least 8 characters" });
    if (!/[A-Z]/.test(form.password))
      errors.push({ field: "password", message: "Must contain an uppercase letter" });
    if (!/[0-9]/.test(form.password))
      errors.push({ field: "password", message: "Must contain a number" });
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password))
      errors.push({ field: "password", message: "Must contain a special character" });
  }

  if (!form.role) {
    errors.push({ field: "role", message: "Role is required" });
  }

  return errors;
}

// ── Component ──

export default function AddStaffModal({
  branchId,
  branchName,
  allowedRoles = ["staff", "manager"],
  onSuccess,
  onClose,
}: AddStaffModalProps) {
  const [form, setForm] = useState<AddStaffForm>({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: allowedRoles[0],
  });

  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function set(key: keyof AddStaffForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => prev.filter((e) => e.field !== key));
    setServerError(null);
  }

  function getError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  async function handleSubmit() {
    const errors = validateForm(form);
    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setServerError(null);
    setFieldErrors([]);

    try {
      const { data } = await apiClient.post(`/branches/${branchId}/staff`, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
      });

      onSuccess(data.data);
    } catch (err: any) {
      const res = err.response?.data;
      if (res?.errors && Array.isArray(res.errors)) {
        setFieldErrors(res.errors);
      } else {
        setServerError(res?.message || "Failed to add staff member");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={branchName ? `Add Staff — ${branchName}` : "Add Staff Member"}
      onClose={onClose}
    >
      <div className="space-y-4 pt-1">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            placeholder="e.g. Priya Sharma"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#5542f6] shadow-xs"
          />
          {getError("name") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("name")}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
          <input
            type="email"
            placeholder="priya@salon.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#5542f6] shadow-xs"
          />
          {getError("email") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("email")}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
          <input
            type="text"
            placeholder="+91-9000000000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#5542f6] shadow-xs"
          />
          {getError("phone") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("phone")}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 chars, uppercase, number, special"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#5542f6] shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {getError("password") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("password")}</p>}
        </div>

        {/* Password strength hints */}
        {form.password.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[
              { label: "8+ chars", pass: form.password.length >= 8 },
              { label: "Uppercase", pass: /[A-Z]/.test(form.password) },
              { label: "Number", pass: /[0-9]/.test(form.password) },
              { label: "Special", pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) },
            ].map((rule) => (
              <span
                key={rule.label}
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  rule.pass
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    : "bg-slate-100 text-slate-400 border border-slate-200/60"
                }`}
              >
                {rule.pass ? "✓" : "○"} {rule.label}
              </span>
            ))}
          </div>
        )}

        {/* Role */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value as "staff" | "manager")}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#5542f6] shadow-xs cursor-pointer capitalize"
          >
            {allowedRoles.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          {getError("role") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("role")}</p>}
        </div>

        {/* Server error */}
        {serverError && (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200/80 rounded-xl px-3 py-2.5 text-xs font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <p>{serverError}</p>
          </div>
        )}
      </div>

      {/* Actions */}
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
          className="flex-1 bg-[#5542f6] hover:bg-[#4332e0] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add Staff"}
        </button>
      </div>
    </Modal>
  );
}