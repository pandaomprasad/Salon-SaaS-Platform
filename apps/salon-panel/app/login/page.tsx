// ============================================================
// app/login/page.tsx
// Split-Screen Layout with High-Resolution Salon Imagery & Branding
// ============================================================

"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Star,
  Zap,
  Building2,
} from "lucide-react";
import { loginSalon } from "@/api/services/authService";
import { tokenStorage } from "@/lib/api-client";
import { mapUser } from "@/lib/mapUser";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { loginSuccess } from "@/store/slices/authSlice";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();

  async function handleLogin(): Promise<void> {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
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
        throw new Error("Invalid credentials or server response.");
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
        setError("Login failed. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-900 font-sans selection:bg-[#5542f6] selection:text-white">
      
      {/* ── Left Side: High-Resolution Salon Imagery & Showcase ── */}
      <div className="lg:col-span-7 xl:col-span-7 relative hidden lg:flex flex-col justify-between p-12 xl:p-16 text-white overflow-hidden min-h-screen">
        
        {/* Background Salon Image */}
        <Image
          src="/salon_banner.png"
          alt="Luxury Salon Interior"
          fill
          priority
          className="object-cover object-center scale-105 transition-transform duration-10000 hover:scale-100"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-900/40 backdrop-brightness-90" />

        {/* Top Branding Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="ST CUT Logo"
              className="w-10 h-10 rounded-xl object-contain bg-black p-1 shrink-0 shadow-lg border border-white/20 backdrop-blur-md"
            />
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-amber-400">
                ST CUT PARTNER
              </p>
              <p className="text-xs font-bold text-white tracking-wide">
                Salon Management Studio
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-xs font-semibold">
            <Sparkles size={13} className="text-amber-400 animate-pulse" />
            <span>Partner Portal</span>
          </div>
        </div>

        {/* Middle Hero Content */}
        <div className="relative z-10 max-w-xl my-auto space-y-6">
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-none text-white drop-shadow-sm">
            Manage your salon with <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-indigo-300 bg-clip-text text-transparent">
              unmatched precision.
            </span>
          </h1>
          <p className="text-sm xl:text-base font-medium text-slate-200 leading-relaxed drop-shadow-xs">
            Real-time appointment bookings, multi-branch scheduling, staff performance, and automated revenue insights — engineered for modern salon creators.
          </p>

          {/* Key Feature Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-md space-y-1">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
                <Zap size={15} />
              </div>
              <p className="text-xs font-bold text-white mt-1">Live Sync</p>
              <p className="text-[10px] text-slate-300 font-medium">Real-time slots</p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-md space-y-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-400/20 text-indigo-300 flex items-center justify-center">
                <Building2 size={15} />
              </div>
              <p className="text-xs font-bold text-white mt-1">Branches</p>
              <p className="text-[10px] text-slate-300 font-medium">Multi-location</p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-md space-y-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
                <ShieldCheck size={15} />
              </div>
              <p className="text-xs font-bold text-white mt-1">Secure</p>
              <p className="text-[10px] text-slate-300 font-medium">Role RBAC</p>
            </div>
          </div>
        </div>

        {/* Bottom Rating Card */}
        <div className="relative z-10 flex items-center justify-between bg-black/40 border border-white/15 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <span className="text-xs font-bold text-white">4.9/5 Rating</span>
          </div>
          <p className="text-xs font-medium text-slate-300">
            Trusted by 500+ Partner Studios
          </p>
        </div>

      </div>

      {/* ── Right Side: Clean Authentication Form Container ── */}
      <div className="lg:col-span-5 xl:col-span-5 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white">
        
        {/* Top Mobile Brand (Visible on small screens) */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center font-bold shadow-md">
            <span className="text-[10px] font-black tracking-tighter text-amber-400">ST</span>
            <span className="text-[8px] font-semibold tracking-wider text-slate-300 -mt-1">CUT</span>
          </div>
          <div>
            <p className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400">
              ST CUT PARTNER
            </p>
            <h2 className="text-sm font-black text-slate-900">
              Salon Management Studio
            </h2>
          </div>
        </div>

        {/* Form Container */}
        <div className="my-auto space-y-7 max-w-sm sm:max-w-md mx-auto w-full">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sign In
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Enter your credentials to access your ST CUT partner dashboard.
            </p>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4" onKeyDown={handleKeyDown}>
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="rameshowner@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#5542f6] focus:ring-2 focus:ring-[#5542f6]/20 focus:outline-none transition-all"
                />
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#5542f6] focus:ring-2 focus:ring-[#5542f6]/20 focus:outline-none transition-all"
                />
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2.5 text-rose-600 bg-rose-50 border border-rose-200/80 rounded-xl px-4 py-3 text-xs font-bold animate-slide-in">
                <AlertCircle size={16} className="shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 bg-[#5542f6] hover:bg-[#4338ca] active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-[#5542f6]/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 text-center">
          <p className="text-[11px] font-medium text-slate-400">
            © 2026 ST CUT PARTNER PLATFORM. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>

    </div>
  );
}