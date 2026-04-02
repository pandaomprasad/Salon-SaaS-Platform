// ============================================================
// app/providers.tsx
// UPDATED — Redux Provider + session hydration on mount
// ============================================================

"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { hydrateAuth } from "@/store/slices/authSlice";

function AuthHydrator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateAuth());
  }, []);
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthHydrator>{children}</AuthHydrator>
    </Provider>
  );
}