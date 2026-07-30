import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiClient, { tokenStorage } from "@/lib/api-client";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const hydrateAuth = createAsyncThunk("auth/hydrate", async (_, { rejectWithValue }) => {
  try {
    const token = tokenStorage.getAccessToken();
    if (!token) return rejectWithValue("No token");
    const { data } = await apiClient.get("/auth/me");
    const u = data.data;
    if (u.role !== "superadmin") {
      tokenStorage.clearTokens();
      return rejectWithValue("Not an admin");
    }
    return { id: u.id || u._id, name: u.name, email: u.email, role: u.role } as AdminUser;
  } catch {
    tokenStorage.clearTokens();
    return rejectWithValue("Session expired");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<AdminUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
      state.isLoading = false;
    },
    logout: (state) => {
      tokenStorage.clearTokens();
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.pending, (state) => { state.isLoading = true; })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;