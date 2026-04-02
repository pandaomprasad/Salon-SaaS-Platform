// ============================================================
// api/services/salonService.ts
// ============================================================

import apiClient from "@/lib/api-client";
import type { ApiResponse, Salon, CreateSalonPayload, UpdateSalonPayload } from "@/lib/api";

export async function createSalon(payload: CreateSalonPayload) {
  const { data } = await apiClient.post<ApiResponse<Salon>>("/salons", payload);
  return data;
}

export async function getSalons() {
  const { data } = await apiClient.get<ApiResponse<Salon[]>>("/salons");
  return data;
}

export async function getSalon(salonId: string) {
  const { data } = await apiClient.get<ApiResponse<Salon>>(`/salons/${salonId}`);
  return data;
}

export async function updateSalon(salonId: string, payload: UpdateSalonPayload) {
  const { data } = await apiClient.patch<ApiResponse<Salon>>(`/salons/${salonId}`, payload);
  return data;
}

export async function deleteSalon(salonId: string) {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/salons/${salonId}`);
  return data;
}