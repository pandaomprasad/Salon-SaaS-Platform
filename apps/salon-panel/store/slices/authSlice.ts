import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Salon {
  name: string;
  // add more later if needed
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  salon: Salon | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  salon: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        salon: Salon;
      }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.salon = action.payload.salon;
      state.isAuthenticated = true;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.salon = null;
      state.isAuthenticated = false;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
