// ============================================================
// api/services/appointmentService.ts
// ============================================================

import apiClient from "@/lib/api-client";
import type {
  ApiResponse,
  PaginatedResponse,
  Appointment,
  BookAppointmentPayload,
  UpdateStatusPayload,
  ReschedulePayload,
  RateAppointmentPayload,
} from "@/lib/api";

/**
 * Generate a UUID v4 for the Idempotency-Key header.
 * Uses crypto.randomUUID where available, falls back to a simple generator.
 */
function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function bookAppointment(payload: BookAppointmentPayload, idempotencyKey?: string) {
  const { data } = await apiClient.post<ApiResponse<Appointment>>("/appointments", payload, {
    headers: { "Idempotency-Key": idempotencyKey || generateIdempotencyKey() },
  });
  return data;
}

export async function getAppointments(params?: { status?: string; page?: number; limit?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Appointment>>("/appointments", { params });
  return data;
}

export async function getAppointment(appointmentId: string) {
  const { data } = await apiClient.get<ApiResponse<Appointment>>(`/appointments/${appointmentId}`);
  return data;
}

export async function updateAppointmentStatus(appointmentId: string, payload: UpdateStatusPayload) {
  const { data } = await apiClient.patch<ApiResponse<Appointment>>(
    `/appointments/${appointmentId}/status`,
    payload,
  );
  return data;
}

export async function rescheduleAppointment(appointmentId: string, payload: ReschedulePayload) {
  const { data } = await apiClient.patch<ApiResponse<Appointment>>(
    `/appointments/${appointmentId}/reschedule`,
    payload,
  );
  return data;
}

export async function rateAppointment(appointmentId: string, payload: RateAppointmentPayload) {
  const { data } = await apiClient.patch<ApiResponse<Appointment>>(
    `/appointments/${appointmentId}/rate`,
    payload,
  );
  return data;
}