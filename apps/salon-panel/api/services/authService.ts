const BASE_URL = "http://localhost:6969/api/v1";

interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  data: {
    salon: any;
    user: User;
    accessToken: string;
  };
  success: boolean;
  message?: string;
}

export const loginSalon = async (
  data: LoginPayload,
): Promise<LoginResponse> => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result: LoginResponse = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Login failed");
  }

  return result;
};
