"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { AlertCircle, Info } from "lucide-react";
import {
  createLeave,
  updateLeave,
  createMyLeave,
} from "@/api/services/leaveService";
import { parseApiError } from "@/lib/api-client";
import type {
  StaffLeave,
  LeaveType,
  CreateLeavePayload,
  Staff,
} from "@/lib/api";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

interface FieldError {
  field: string;
  message: string;
}

interface LeaveFormModalProps {
  branchId: string;
  staffList: Staff[];
  defaultStaffId?: string;
  selfMode?: boolean; // staff managing their own leave
  editing?: StaffLeave | null;
  onSuccess: () => void;
  onClose: () => void;
}

function formatDateForInput(dateStr?: string): string {
  return dateStr || "";
}

interface LeaveFormState {
  staffId: string;
  type: LeaveType;
  date: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  allDay: boolean;
  startTime: string;
  endTime: string;
  reason: string;
}

function toApiPayload(form: LeaveFormState): CreateLeavePayload {
  const payload: CreateLeavePayload = {
    type: form.type,
    reason: form.reason.trim() || undefined,
  };
  if (!form.allDay) {
    payload.startTime = form.startTime;
    payload.endTime = form.endTime;
  }
  if (form.type === "SINGLE") {
    payload.date = form.date;
  } else {
    payload.startDate = form.startDate;
    payload.endDate = form.endDate;
    if (form.type === "RECURRING") {
      payload.weekdays = form.weekdays;
    }
  }
  return payload;
}

export default function LeaveFormModal({
  branchId,
  staffList,
  defaultStaffId,
  selfMode = false,
  editing = null,
  onSuccess,
  onClose,
}: LeaveFormModalProps) {
  const isEdit = !!editing;

  const [form, setForm] = useState(() => ({
    staffId: editing?.staffId || defaultStaffId || staffList[0]?._id || "",
    type: (editing?.type || "SINGLE") as LeaveType,
    date: formatDateForInput(editing?.date),
    startDate: formatDateForInput(editing?.startDate),
    endDate: formatDateForInput(editing?.endDate),
    weekdays: editing?.weekdays || [],
    allDay: editing ? editing.allDay !== false : true,
    startTime: editing?.startTime || "09:00",
    endTime: editing?.endTime || "18:00",
    reason: editing?.reason || "",
  }));

  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: keyof LeaveFormState, value: string | boolean | number[]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => prev.filter((e) => e.field !== key));
    setServerError(null);
  }

  function getError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  function toggleWeekday(v: number) {
    setForm((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(v)
        ? prev.weekdays.filter((w: number) => w !== v)
        : [...prev.weekdays, v],
    }));
    setFieldErrors((prev) => prev.filter((e) => e.field !== "weekdays"));
    setServerError(null);
  }

  function validate(): FieldError[] {
    const errors: FieldError[] = [];
    if (!form.staffId && !selfMode) {
      errors.push({ field: "staffId", message: "Select a staff member" });
    }
    if (form.type === "SINGLE" && !form.date) {
      errors.push({ field: "date", message: "Date is required" });
    }
    if (form.type !== "SINGLE") {
      if (!form.startDate) {
        errors.push({ field: "startDate", message: "Start date is required" });
      }
      if (!form.endDate) {
        errors.push({ field: "endDate", message: "End date is required" });
      } else if (form.startDate && form.endDate < form.startDate) {
        errors.push({
          field: "endDate",
          message: "End date must be on or after start date",
        });
      }
    }
    if (form.type === "RECURRING" && form.weekdays.length === 0) {
      errors.push({ field: "weekdays", message: "Pick at least one weekday" });
    }
    if (!form.allDay) {
      if (!form.startTime || !form.endTime) {
        errors.push({
          field: "startTime",
          message: "Start and end time are required",
        });
      } else if (form.endTime <= form.startTime) {
        errors.push({
          field: "endTime",
          message: "End time must be after start time",
        });
      }
    }
    if (form.reason.trim().length > 200) {
      errors.push({ field: "reason", message: "Reason must be ≤ 200 characters" });
    }
    return errors;
  }

  async function handleSubmit() {
    const errors = validate();
    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSaving(true);
    setServerError(null);
    setFieldErrors([]);
    try {
      const payload = toApiPayload(form);
      if (selfMode) {
        await createMyLeave(payload);
      } else if (isEdit && editing) {
        await updateLeave(branchId, form.staffId, editing._id, payload);
      } else {
        await createLeave(branchId, form.staffId, payload);
      }
      onSuccess();
    } catch (err: unknown) {
      setServerError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Leave" : selfMode ? "Request Leave" : "Add Leave"}
      onClose={onClose}
    >
      <div className="space-y-4 pt-1">
        {!selfMode && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Staff Member</label>
            <select
              value={form.staffId}
              onChange={(e) => set("staffId", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#5542f6] shadow-xs cursor-pointer"
            >
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.role?.name || "staff"})
                </option>
              ))}
            </select>
            {getError("staffId") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("staffId")}</p>}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type</label>
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value as LeaveType)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#5542f6] shadow-xs cursor-pointer"
          >
            <option value="SINGLE">Single Day</option>
            <option value="RANGE">Date Range</option>
            <option value="RECURRING">Recurring (weekly)</option>
          </select>
          {getError("type") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("type")}</p>}
        </div>

        {form.type === "SINGLE" ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#5542f6] shadow-xs cursor-pointer"
            />
            {getError("date") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("date")}</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#5542f6] shadow-xs cursor-pointer"
              />
              {getError("startDate") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("startDate")}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#5542f6] shadow-xs cursor-pointer"
              />
              {getError("endDate") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("endDate")}</p>}
            </div>
          </div>
        )}

        {form.type === "RECURRING" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Weekly On</label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => {
                const active = form.weekdays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleWeekday(d.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      active
                        ? "bg-[#5542f6] text-white border-[#5542f6] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            {getError("weekdays") && (
              <p className="text-[11px] text-rose-600 font-medium">{getError("weekdays")}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
          <div>
            <p className="text-xs font-extrabold text-slate-900">
              {form.allDay ? "Full Day Leave" : "Time Window"}
            </p>
            <p className="text-[11px] font-medium text-slate-500">
              {form.allDay
                ? "Staff member is unavailable the entire day"
                : "Staff member is unavailable only within this time window"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => set("allDay", !form.allDay)}
            className={`w-10 h-6 rounded-full transition-all relative shrink-0 ${
              form.allDay ? "bg-[#5542f6]" : "bg-slate-300"
            }`}
            aria-label="Toggle all day"
          >
            <span
              className={`absolute top-1 bg-white rounded-full shadow-xs transition-all w-4 h-4 ${
                form.allDay ? "left-5" : "left-1"
              }`}
            />
          </button>
        </div>

        {!form.allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none shadow-xs"
              />
              {getError("startTime") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("startTime")}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none shadow-xs"
              />
              {getError("endTime") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("endTime")}</p>}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Reason (optional)</label>
          <input
            type="text"
            placeholder="e.g. Doctor appointment, vacation…"
            value={form.reason}
            onChange={(e) => set("reason", e.target.value)}
            maxLength={200}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#5542f6] shadow-xs"
          />
          {getError("reason") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("reason")}</p>}
        </div>

        {serverError && (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200/80 rounded-xl px-3 py-2.5 text-xs font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <p>{serverError}</p>
          </div>
        )}

        {selfMode && !serverError && (
          <div className="flex items-center gap-2.5 text-blue-700 bg-blue-50/80 border border-blue-200/80 rounded-xl px-3.5 py-2.5 text-xs font-medium">
            <Info size={15} className="text-blue-600 shrink-0" />
            <p>
              This request will be sent to the manager for approval. Slots are blocked only after it is approved.
            </p>
          </div>
        )}
      </div>

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
          {saving ? "Saving..." : isEdit ? "Save Changes" : selfMode ? "Request Leave" : "Add Leave"}
        </button>
      </div>
    </Modal>
  );
}
