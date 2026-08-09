import apiClient from "@/lib/api-client";
import type {
  ApiResponse,
  StaffLeave,
  CreateLeavePayload,
  UpdateLeavePayload,
} from "@/lib/api";

export async function getStaffLeaves(
  branchId: string,
  staffId: string,
  includePast = false,
) {
  const { data } = await apiClient.get<ApiResponse<{ leaves: StaffLeave[] }>>(
    `/branches/${branchId}/staff/${staffId}/leaves`,
    { params: { includePast: includePast || undefined } },
  );
  return data.data.leaves;
}

export async function createLeave(
  branchId: string,
  staffId: string,
  payload: CreateLeavePayload,
) {
  const { data } = await apiClient.post<ApiResponse<{ leave: StaffLeave }>>(
    `/branches/${branchId}/staff/${staffId}/leaves`,
    payload,
  );
  return data.data.leave;
}

export async function updateLeave(
  branchId: string,
  staffId: string,
  leaveId: string,
  payload: UpdateLeavePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<{ leave: StaffLeave }>>(
    `/branches/${branchId}/staff/${staffId}/leaves/${leaveId}`,
    payload,
  );
  return data.data.leave;
}

export async function deleteLeave(
  branchId: string,
  staffId: string,
  leaveId: string,
) {
  const { data } = await apiClient.delete<ApiResponse<{ leave: StaffLeave }>>(
    `/branches/${branchId}/staff/${staffId}/leaves/${leaveId}`,
  );
  return data.data.leave;
}

export async function approveLeave(
  branchId: string,
  staffId: string,
  leaveId: string,
) {
  const { data } = await apiClient.post<ApiResponse<{ leave: StaffLeave }>>(
    `/branches/${branchId}/staff/${staffId}/leaves/${leaveId}/approve`,
  );
  return data.data.leave;
}

export async function rejectLeave(
  branchId: string,
  staffId: string,
  leaveId: string,
  rejectionReason?: string,
) {
  const { data } = await apiClient.post<ApiResponse<{ leave: StaffLeave }>>(
    `/branches/${branchId}/staff/${staffId}/leaves/${leaveId}/reject`,
    { rejectionReason: rejectionReason || undefined },
  );
  return data.data.leave;
}

// ── Staff self-service ──

export async function getMyLeaves(includePast = false) {
  const { data } = await apiClient.get<ApiResponse<{ leaves: StaffLeave[] }>>(
    `/staff/me/leaves`,
    { params: { includePast: includePast || undefined } },
  );
  return data.data.leaves;
}

export async function createMyLeave(payload: CreateLeavePayload) {
  const { data } = await apiClient.post<ApiResponse<{ leave: StaffLeave }>>(
    `/staff/me/leaves`,
    payload,
  );
  return data.data.leave;
}

export async function cancelMyLeave(leaveId: string) {
  const { data } = await apiClient.delete<ApiResponse<{ leave: StaffLeave }>>(
    `/staff/me/leaves/${leaveId}`,
  );
  return data.data.leave;
}
