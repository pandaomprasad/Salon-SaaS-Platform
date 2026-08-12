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

export async function googleLoginSalon(
  payload: { idToken?: string; googleUser?: any; role?: string },
): Promise<ApiResponse<LoginResponse>> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
    "/auth/google",
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

export interface OwnerRegistrationPayload {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  salonName: string;
  salonDescription?: string;
  password: string;
}

export interface OwnerRegistrationResume {
  _id: string;
  ownerName: string;
  ownerEmail: string;
  salonName: string;
  status: string;
  createdAt: string;
}

export interface OwnerRegistrationResponse {
  request: OwnerRegistrationResume;
}

/** Submit a salon-owner registration request for admin approval */
export async function registerOwner(
  payload: OwnerRegistrationPayload,
): Promise<ApiResponse<OwnerRegistrationResponse>> {
  const { data } = await apiClient.post<ApiResponse<OwnerRegistrationResponse>>(
    "/auth/register-owner",
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