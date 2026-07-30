// ============================================================
// app/login/page.tsx
// UPDATED — stores both tokens, uses apiClient-backed authService
// ============================================================

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Mail, Lock, AlertCircle } from "lucide-react";

import { loginSalon } from "@/api/services/authService";
import { tokenStorage } from "@/lib/api-client";
import { mapUser } from "@/lib/mapUser";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { loginSuccess } from "@/store/slices/authSlice";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  async function handleLogin(): Promise<void> {
    setError("");
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const data = await loginSalon({
        email: email.trim().toLowerCase(),
        password,
      });

      const backendUser = data.data?.user;
      const accessToken = data.data?.accessToken;
      const refreshToken = data.data?.refreshToken;
      const salon = data.data?.salon;

      if (!backendUser || !accessToken) {
        throw new Error("Invalid response from server");
      }

      tokenStorage.setTokens(accessToken, refreshToken || "");

      const formattedUser = mapUser(backendUser);

      dispatch(
        loginSuccess({
          user: formattedUser,
          token: accessToken,
          salon,
        }),
      );

      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleLogin();
  }

  const demoAccounts = [
    { role: "Owner", email: "aria@luxesalon.com", password: "owner123" },
    { role: "Manager", email: "marco@luxesalon.com", password: "manager123" },
    { role: "Staff", email: "jade@luxesalon.com", password: "staff123" },
  ];

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Branding */}
        <div className="text-center mb-10">
          <p className="text-[11px] tracking-[0.4em] text-muted uppercase mb-3 animate-fade-in [animation-delay:100ms] opacity-0">
            Premium Management
          </p>
          <h1 className="font-display text-5xl text-ink mb-2 animate-fade-in [animation-delay:200ms] opacity-0">
            Luxe Salon
          </h1>
          <div className="h-0.5 w-12 bg-accent/20 mx-auto animate-fade-in [animation-delay:300ms] opacity-0" />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-border/50 backdrop-blur-sm animate-fade-in [animation-delay:400ms] opacity-0">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-ink">Welcome Back</h2>
            <p className="text-[13px] text-slate mt-1">Please enter your credentials to access the panel.</p>
          </div>

          <div className="space-y-6" onKeyDown={handleKeyDown}>
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="aria@luxesalon.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                icon={<Mail size={16} className="text-muted/60" />}
                className="h-12 text-sm rounded-xl"
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                icon={<Lock size={16} className="text-muted/60" />}
                className="h-12 text-sm rounded-xl"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 text-danger bg-danger/5 border border-danger/10 rounded-xl px-4 py-3 animate-slide-in">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-xs font-medium">{error}</p>
              </div>
            )}

            <Button
              className="w-full h-12 text-sm font-semibold rounded-xl"
              size="lg"
              onClick={handleLogin}
              loading={loading}
              disabled={loading}
            >
              Sign In to Dashboard
            </Button>
          </div>

          {/* Subtle Demo Reveal */}
          <div className="mt-8 pt-8 border-t border-border/50">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="text-[11px] font-semibold text-muted hover:text-accent transition-colors flex items-center gap-1.5 mx-auto uppercase tracking-wider"
            >
              {showDemo ? "Hide Quick Access" : "Quick access credentials"}
            </button>
            
            {showDemo && (
              <div className="mt-4 grid grid-cols-1 gap-2 animate-slide-up">
                {demoAccounts.map((c) => (
                  <div
                    key={c.role}
                    onClick={() => {
                      setEmail(c.email);
                      setPassword(c.password);
                      setError("");
                    }}
                    className="flex flex-col p-3 bg-subtle border border-border/30 rounded-xl cursor-pointer hover:border-accent/40 hover:bg-accent/[0.02] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-slate uppercase">{c.role}</span>
                      <span className="text-[9px] text-muted group-hover:text-accent font-medium">Auto-fill</span>
                    </div>
                    <span className="text-xs text-ink font-medium">{c.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center mt-10 text-[11px] text-muted/60 font-medium">
          © 2026 LUXE SALON PLATFORM. ALL RIGHTS RESERVED.
        </p>
      </div>
    </div>
  );
}