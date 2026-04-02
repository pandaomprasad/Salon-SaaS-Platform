// ============================================================
// store/slices/authSlice.ts
// UPDATED — handles real backend response shape + refresh token
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { loginSalon, getMe, logoutSalon } from "@/api/services/authService";
import { tokenStorage } from "@/lib/api-client";
import { mapUser } from "@/lib/mapUser";
import type { User } from "@/lib/types";
import type { BackendUser, Salon } from "@/lib/api";

// ── State shape ──────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  salon: Salon | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  salon: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// ── Async thunks ─────────────────────────

/** Login and store both tokens */
export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    payload: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await loginSalon(payload);
      const { user, accessToken, refreshToken, salon } = res.data;

      // Store both tokens
      tokenStorage.setTokens(accessToken, refreshToken);

      return {
        user: mapUser(user),
        token: accessToken,
        salon: salon || null,
      };
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response: { data: { message: string } } };
        return rejectWithValue(axiosErr.response.data.message);
      }
      return rejectWithValue("Login failed");
    }
  },
);

/** Hydrate session — call on app mount to restore from stored token */
export const hydrateAuth = createAsyncThunk(
  "auth/hydrate",
  async (_, { rejectWithValue }) => {
    try {
      const token = tokenStorage.getAccessToken();
      if (!token) return rejectWithValue("No token");

      const res = await getMe();
      const backendUser = res.data;

      return {
        user: mapUser(backendUser),
        token,
      };
    } catch {
      tokenStorage.clearTokens();
      return rejectWithValue("Session expired");
    }
  },
);

/** Logout — call backend then clear local state */
export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  try {
    await logoutSalon();
  } catch {
    // ignore — clear locally regardless
  } finally {
    tokenStorage.clearTokens();
  }
});

// ── Slice ────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Keep this for backward compatibility with your login page */
    loginSuccess: (
      state,
      action: PayloadAction<{ user: User; token: string; salon?: Salon | null }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.salon = action.payload.salon || null;
      state.isAuthenticated = true;
      state.error = null;
    },
    logout: (state) => {
      tokenStorage.clearTokens();
      state.user = null;
      state.token = null;
      state.salon = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── loginThunk ──
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.salon = action.payload.salon;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Login failed";
      });

    // ── hydrateAuth ──
    builder
      .addCase(hydrateAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });

    // ── logoutThunk ──
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.salon = null;
      state.isAuthenticated = false;
    });
  },
});

export const { loginSuccess, logout, clearError } = authSlice.actions;
export default authSlice.reducer;