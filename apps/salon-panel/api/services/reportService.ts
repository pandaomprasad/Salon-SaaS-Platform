// ============================================================
// api/services/reportService.ts
// ============================================================

import apiClient from "@/lib/api-client";
import type {
  ApiResponse,
  ReportOverview,
  PopularService,
  StaffPerformance,
  DailyBooking,
  SlotUtilization,
  ReportQueryParams,
} from "@/lib/api";

export async function getOverview(params: ReportQueryParams) {
  const { data } = await apiClient.get<ApiResponse<ReportOverview>>("/reports/overview", { params });
  return data;
}

export async function getPopularServices(params: ReportQueryParams) {
  const { data } = await apiClient.get<ApiResponse<PopularService[]>>("/reports/popular-services", { params });
  return data;
}

export async function getStaffPerformance(params: ReportQueryParams) {
  const { data } = await apiClient.get<ApiResponse<StaffPerformance[]>>("/reports/staff-performance", { params });
  return data;
}

export async function getDailyBookings(params: ReportQueryParams) {
  const { data } = await apiClient.get<ApiResponse<DailyBooking[]>>("/reports/daily-bookings", { params });
  return data;
}

export async function getSlotUtilization(params: { date: string }) {
  const { data } = await apiClient.get<ApiResponse<SlotUtilization>>("/reports/slot-utilization", { params });
  return data;
}