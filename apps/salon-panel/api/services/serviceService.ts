// ============================================================
// api/services/serviceService.ts
// ============================================================

import apiClient from "@/lib/api-client";
import type {
  ApiResponse,
  Service,
  CreateServicePayload,
  UpdateServicePayload,
  AssignStaffPayload,
} from "@/lib/api";

export async function createService(branchId: string, payload: CreateServicePayload) {
  const { data } = await apiClient.post<ApiResponse<Service>>(`/branches/${branchId}/services`, payload);
  return data;
}

export async function getServices(branchId: string) {
  const { data } = await apiClient.get<ApiResponse<Service[]>>(`/branches/${branchId}/services`);
  return data;
}

export async function getService(branchId: string, serviceId: string) {
  const { data } = await apiClient.get<ApiResponse<Service>>(`/branches/${branchId}/services/${serviceId}`);
  return data;
}

export async function updateService(branchId: string, serviceId: string, payload: UpdateServicePayload) {
  const { data } = await apiClient.patch<ApiResponse<Service>>(`/branches/${branchId}/services/${serviceId}`, payload);
  return data;
}

export async function deleteService(branchId: string, serviceId: string) {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/branches/${branchId}/services/${serviceId}`);
  return data;
}

export async function assignStaffToService(branchId: string, serviceId: string, payload: AssignStaffPayload) {
  const { data } = await apiClient.patch<ApiResponse<Service>>(
    `/branches/${branchId}/services/${serviceId}/staff`,
    payload,
  );
  return data;
}