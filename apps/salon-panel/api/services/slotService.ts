// ============================================================
// api/services/slotService.ts
// ============================================================

import apiClient from "@/lib/api-client";
import type {
  ApiResponse,
  Slot,
  GenerateSlotsPayload,
  BlockCheckPayload,
  BlockBulkPayload,
} from "@/lib/api";

export async function generateSlots(branchId: string, payload: GenerateSlotsPayload) {
  const { data } = await apiClient.post<ApiResponse<{ count: number }>>(
    `/branches/${branchId}/slots/generate`,
    payload,
  );
  return data;
}

export async function getSlots(branchId: string, date: string) {
  const { data } = await apiClient.get<ApiResponse<Slot[]>>(`/branches/${branchId}/slots`, {
    params: { date },
  });
  return data;
}

export async function blockCheck(branchId: string, payload: BlockCheckPayload) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/branches/${branchId}/slots/block-check`,
    payload,
  );
  return data;
}

export async function blockBulk(branchId: string, payload: BlockBulkPayload) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/branches/${branchId}/slots/block-bulk`,
    payload,
  );
  return data;
}

export async function unblockBulk(branchId: string, payload: { staffId: string; date: string }) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/branches/${branchId}/slots/unblock-bulk`,
    payload,
  );
  return data;
}

export async function blockSlot(branchId: string, slotId: string) {
  const { data } = await apiClient.patch<ApiResponse<Slot>>(
    `/branches/${branchId}/slots/${slotId}/block`,
  );
  return data;
}

export async function unblockSlot(branchId: string, slotId: string) {
  const { data } = await apiClient.patch<ApiResponse<Slot>>(
    `/branches/${branchId}/slots/${slotId}/unblock`,
  );
  return data;
}