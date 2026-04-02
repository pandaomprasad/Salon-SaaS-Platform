// ============================================================
// api/services/staffService.ts
// ============================================================

import apiClient from "@/lib/api-client";
import type {
  ApiResponse,
  Staff,
  CreateStaffPayload,
  UpdateStaffPayload,
  UpdatePermissionsPayload,
} from "@/lib/api";

export async function createStaff(branchId: string, payload: CreateStaffPayload) {
  const { data } = await apiClient.post<ApiResponse<Staff>>(`/branches/${branchId}/staff`, payload);
  return data;
}

export async function getStaffList(branchId: string) {
  const { data } = await apiClient.get<ApiResponse<Staff[]>>(`/branches/${branchId}/staff`);
  return data;
}

export async function getStaffMember(branchId: string, staffId: string) {
  const { data } = await apiClient.get<ApiResponse<Staff>>(`/branches/${branchId}/staff/${staffId}`);
  return data;
}

export async function updateStaff(branchId: string, staffId: string, payload: UpdateStaffPayload) {
  const { data } = await apiClient.patch<ApiResponse<Staff>>(`/branches/${branchId}/staff/${staffId}`, payload);
  return data;
}

export async function deleteStaff(branchId: string, staffId: string) {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/branches/${branchId}/staff/${staffId}`);
  return data;
}

export async function getStaffPermissions(branchId: string, staffId: string) {
  const { data } = await apiClient.get<ApiResponse<{ extraPermissions: string[]; deniedPermissions: string[] }>>(
    `/branches/${branchId}/staff/${staffId}/permissions`,
  );
  return data;
}

export async function updateStaffPermissions(branchId: string, staffId: string, payload: UpdatePermissionsPayload) {
  const { data } = await apiClient.patch<ApiResponse<Staff>>(
    `/branches/${branchId}/staff/${staffId}/permissions`,
    payload,
  );
  return data;
}