"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
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
    // Clear field-specific errors on change
    setFieldErrors((prev) => prev.filter((e) => e.field !== key));
    setServerError(null);
  }

  function getError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  async function handleSubmit() {
    // Client-side validation
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

      // Map backend validation errors to field errors
      if (res?.errors && Array.isArray(res.errors)) {
        setFieldErrors(res.errors);
      } else {
        setServerError(res?.message || "Failed to add staff member");
      }
    } finally {
      setSaving(false);
    }
  }

  const roleOptions = allowedRoles.map((r) => ({
    value: r,
    label: r.charAt(0).toUpperCase() + r.slice(1),
  }));

  return (
    <Modal
      title={branchName ? `Add Staff — ${branchName}` : "Add Staff Member"}
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Name */}
        <Input
          label="Full Name"
          placeholder="e.g. Priya Sharma"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={getError("name")}
        />

        {/* Email */}
        <Input
          label="Email"
          type="email"
          placeholder="priya@salon.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          error={getError("email")}
        />

        {/* Phone */}
        <Input
          label="Phone"
          placeholder="+91-9000000000"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          error={getError("phone")}
        />

        {/* Password */}
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Min 8 chars, uppercase, number, special"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            error={getError("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-silver hover:text-ash transition-colors"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {/* Password strength hints */}
        {form.password.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {[
              { label: "8+ chars", pass: form.password.length >= 8 },
              { label: "Uppercase", pass: /[A-Z]/.test(form.password) },
              { label: "Number", pass: /[0-9]/.test(form.password) },
              { label: "Special", pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) },
            ].map((rule) => (
              <span
                key={rule.label}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  rule.pass
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-smoke text-ash"
                }`}
              >
                {rule.pass ? "✓" : "○"} {rule.label}
              </span>
            ))}
          </div>
        )}

        {/* Role */}
        <Select
          label="Role"
          value={form.role}
          onChange={(e) => set("role", e.target.value as "staff" | "manager")}
          options={roleOptions}
          error={getError("role")}
        />

        {/* Server error */}
        {serverError && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-3 py-2.5">
            <AlertCircle size={14} className="shrink-0" />
            <p className="text-xs">{serverError}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSubmit} loading={saving}>
          Add Staff
        </Button>
      </div>
    </Modal>
  );
}