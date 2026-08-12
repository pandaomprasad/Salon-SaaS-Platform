import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6969/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export interface ParsedApiError {
  message: string;
  errors?: { field: string; message: string }[];
  status: number;
}

export function parseApiError(error: unknown): ParsedApiError {
  if (axios.isAxiosError(error) && error.response) {
    return {
      message: error.response.data?.message || "Something went wrong",
      errors: error.response.data?.errors,
      status: error.response.status,
    };
  }
  return {
    message: error instanceof Error ? error.message : "Network error. Please try again.",
    status: 0,
  };
}

export default apiClient;
