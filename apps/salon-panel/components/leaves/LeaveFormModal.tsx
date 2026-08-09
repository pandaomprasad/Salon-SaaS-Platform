"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
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
      width="max-w-xl"
    >
      <div className="space-y-4">
        {!selfMode && (
          <Select
            label="Staff Member"
            value={form.staffId}
            onChange={(e) => set("staffId", e.target.value)}
            options={staffList.map((s) => ({
              value: s._id,
              label: `${s.name} (${s.role.name})`,
            }))}
            error={getError("staffId")}
          />
        )}

        <Select
          label="Leave Type"
          value={form.type}
          onChange={(e) => set("type", e.target.value as LeaveType)}
          options={[
            { value: "SINGLE", label: "Single Day" },
            { value: "RANGE", label: "Date Range" },
            { value: "RECURRING", label: "Recurring (weekly)" },
          ]}
          error={getError("type")}
        />

        {form.type === "SINGLE" ? (
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            error={getError("date")}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              error={getError("startDate")}
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              error={getError("endDate")}
            />
          </div>
        )}

        {form.type === "RECURRING" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate">
              Weekly On
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => {
                const active = form.weekdays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleWeekday(d.value)}
                    className={`
                      px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all
                      ${
                        active
                          ? "bg-accent/10 text-accent border-accent/30"
                          : "bg-white text-slate border-border hover:border-silver"
                      }
                    `}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            {getError("weekdays") && (
              <p className="text-[11px] text-danger">{getError("weekdays")}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between bg-subtle rounded-lg px-3 py-2.5">
          <div>
            <p className="text-[13px] font-medium text-ink">
              {form.allDay ? "Full Day" : "Time Window"}
            </p>
            <p className="text-[11px] text-muted">
              {form.allDay
                ? "Staff is unavailable the entire day"
                : "Staff is unavailable only within this window"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              set("allDay", !form.allDay);
            }}
            className={`
              w-10 h-5.5 rounded-full transition-colors relative shrink-0
              ${form.allDay ? "bg-accent" : "bg-border"}
            `}
            style={{ width: 40, height: 22 }}
            aria-label="Toggle all day"
          >
            <span
              className="absolute top-0.5 bg-white rounded-full shadow transition-all"
              style={{
                width: 18,
                height: 18,
                left: form.allDay ? 20 : 2,
              }}
            />
          </button>
        </div>

        {!form.allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(e) => set("startTime", e.target.value)}
              error={getError("startTime")}
            />
            <Input
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(e) => set("endTime", e.target.value)}
              error={getError("endTime")}
            />
          </div>
        )}

        <Input
          label="Reason (optional)"
          placeholder="e.g. Doctor appointment, vacation…"
          value={form.reason}
          onChange={(e) => set("reason", e.target.value)}
          error={getError("reason")}
          maxLength={200}
        />

        {serverError && (
          <div className="flex items-center gap-2 text-danger bg-danger/5 rounded-xl px-3 py-2.5">
            <AlertCircle size={14} className="shrink-0" />
            <p className="text-xs">{serverError}</p>
          </div>
        )}

        {selfMode && !serverError && (
          <div className="flex items-center gap-2 text-slate bg-accent/5 border border-accent/15 rounded-xl px-3 py-2.5">
            <Info size={14} className="text-accent shrink-0" />
            <p className="text-xs">
              This request will be sent to the manager for approval. Slots are
              blocked only after it is approved.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSubmit} loading={saving}>
          {isEdit ? "Save Changes" : selfMode ? "Request Leave" : "Add Leave"}
        </Button>
      </div>
    </Modal>
  );
}
