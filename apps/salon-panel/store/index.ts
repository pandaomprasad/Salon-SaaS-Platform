// ============================================================
// store/index.ts
// Redux store setup with typed hooks
// ============================================================

import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add more slices here as you build more features:
    // branches: branchReducer,
    // appointments: appointmentReducer,
  },
});

// ── Typed hooks ──────────────────────────

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;