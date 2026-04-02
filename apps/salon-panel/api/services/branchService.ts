// ============================================================
// api/services/branchService.ts
// ============================================================

import apiClient from "@/lib/api-client";
import type { ApiResponse, Branch, CreateBranchPayload, UpdateBranchPayload } from "@/lib/api";

export async function createBranch(salonId: string, payload: CreateBranchPayload) {
  const { data } = await apiClient.post<ApiResponse<Branch>>(`/salons/${salonId}/branches`, payload);
  return data;
}

export async function getBranches(salonId: string) {
  const { data } = await apiClient.get<ApiResponse<Branch[]>>(`/salons/${salonId}/branches`);
  return data;
}

export async function getBranch(salonId: string, branchId: string) {
  const { data } = await apiClient.get<ApiResponse<Branch>>(`/salons/${salonId}/branches/${branchId}`);
  return data;
}

export async function updateBranch(salonId: string, branchId: string, payload: UpdateBranchPayload) {
  const { data } = await apiClient.patch<ApiResponse<Branch>>(`/salons/${salonId}/branches/${branchId}`, payload);
  return data;
}

export async function deleteBranch(salonId: string, branchId: string) {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/salons/${salonId}/branches/${branchId}`);
  return data;
}