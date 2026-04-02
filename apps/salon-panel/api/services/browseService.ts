// ============================================================
// api/services/browseService.ts
// Public browse endpoints — no auth required
// ============================================================

import apiClient from "@/lib/api-client";
import type {
  ApiResponse,
  Salon,
  Branch,
  Service,
  Slot,
  BrowseSalonParams,
  BrowseBranchParams,
} from "@/lib/api";

export async function browseSalons(params?: BrowseSalonParams) {
  const { data } = await apiClient.get<ApiResponse<Salon[]>>("/browse/salons", { params });
  return data;
}

export async function browseSalonById(salonId: string) {
  const { data } = await apiClient.get<ApiResponse<Salon & { branches: Branch[] }>>(
    `/browse/salons/${salonId}`,
  );
  return data;
}

export async function browseBranches(params?: BrowseBranchParams) {
  const { data } = await apiClient.get<ApiResponse<Branch[]>>("/browse/branches", { params });
  return data;
}

export async function browseBranchById(branchId: string) {
  const { data } = await apiClient.get<ApiResponse<Branch & { services: Service[] }>>(
    `/browse/branches/${branchId}`,
  );
  return data;
}

export async function browseBranchSlots(branchId: string, date: string) {
  const { data } = await apiClient.get<ApiResponse<Record<string, Slot[]>>>(
    `/browse/branches/${branchId}/slots`,
    { params: { date } },
  );
  return data;
}

export async function browseBranchServices(branchId: string) {
  const { data } = await apiClient.get<ApiResponse<Service[]>>(
    `/browse/branches/${branchId}/services`,
  );
  return data;
}