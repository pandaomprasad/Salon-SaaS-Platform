// ============================================================
// api/services/authService.ts
// REPLACES your existing authService — now uses apiClient
// ============================================================

import apiClient from "@/lib/api-client";
import type {
  ApiResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  BackendUser,
} from "@/lib/api";

export async function loginSalon(
  payload: LoginPayload,
): Promise<ApiResponse<LoginResponse>> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
    "/auth/login",
    payload,
  );
  return data;
}

export async function registerCustomer(
  payload: RegisterPayload,
): Promise<ApiResponse<LoginResponse>> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
    "/auth/register",
    payload,
  );
  return data;
}

export async function refreshToken(
  refreshToken: string,
): Promise<ApiResponse<{ accessToken: string; refreshToken?: string }>> {
  const { data } = await apiClient.post("/auth/refresh", { refreshToken });
  return data;
}

export async function logoutSalon(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function getMe(): Promise<ApiResponse<BackendUser>> {
  const { data } = await apiClient.get<ApiResponse<BackendUser>>("/auth/me");
  return data;
}