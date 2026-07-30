"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { loginSuccess } from "@/store/slices/authSlice";
import apiClient, { tokenStorage } from "@/lib/api-client";
import { Shield, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  async function handleLogin() {
    setError("");
    if (!email || !password) { setError("Enter email and password"); return; }

    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const user = data.data?.user;
      const accessToken = data.data?.accessToken;
      const refreshToken = data.data?.refreshToken;

      if (!user || !accessToken) throw new Error("Invalid response");

      // Verify superadmin role
      const decoded = JSON.parse(atob(accessToken.split(".")[1]));
      if (decoded.role !== "superadmin") {
        setError("Access denied. This panel is for platform administrators only.");
        setLoading(false);
        return;
      }

      tokenStorage.setTokens(accessToken, refreshToken || "");
      dispatch(loginSuccess({
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: "superadmin",
      }));

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Shield size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Salon HQ</h1>
          <p className="text-[13px] text-muted mt-1">Admin Panel</p>
        </div>

        {/* Form */}
        <div className="bg-charcoal rounded-xl p-6 border border-white/5">
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-medium text-muted block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="admin@salonhq.com"
                  className="w-full bg-ink border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-white placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full bg-ink border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-white placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-danger bg-danger/10 rounded-lg px-3 py-2.5">
                <AlertCircle size={13} />
                <p className="text-[12px]">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-accent text-white rounded-lg py-2.5 text-[13px] font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-muted/40 text-center mt-6">
          Platform administrators only
        </p>
      </div>
    </div>
  );
}