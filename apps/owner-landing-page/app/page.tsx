"use client";

import { useState } from "react";
import {
  Sparkles,
  Building2,
  Calendar,
  Users,
  TrendingUp,
  Bell,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  HelpCircle,
  Clock,
  Briefcase,
  Star,
  Zap,
  Sliders,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import apiClient, { parseApiError } from "@/lib/api-client";

const EMAIL_RE = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export default function LandingPage() {
  // ── Registration Form State ──────────────────────────────
  const [salonName, setSalonName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [salonDescription, setSalonDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({});
  const [submittedData, setSubmittedData] = useState<null | {
    _id: string;
    ownerName: string;
    ownerEmail: string;
    salonName: string;
  }>(null);

  // ── Interactive Panel Guide Tab State ────────────────────
  const [activeGuideTab, setActiveGuideTab] = useState<
    "dashboard" | "bookings" | "branches" | "staff" | "reports"
  >("dashboard");

  // ── ROI Calculator State ────────────────────────────────
  const [branchCount, setBranchCount] = useState(2);
  const [dailyBookings, setDailyBookings] = useState(25);
  const [avgTicketPrice, setAvgTicketPrice] = useState(1200); // INR or USD equivalent

  // ── FAQ Accordion State ────────────────────────────────
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ── Form Validation ──────────────────────────────────────
  function validateForm(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (salonName.trim().length < 2) errs.salonName = "Salon name is required (min 2 chars)";
    if (ownerName.trim().length < 2) errs.ownerName = "Owner name is required (min 2 chars)";
    if (!EMAIL_RE.test(email.trim())) errs.email = "Please enter a valid email address";
    if (!phone.trim()) errs.phone = "Phone number is required";

    const passwordRules: [RegExp, string][] = [
      [/^.{8,}$/, "At least 8 characters"],
      [/[A-Z]/, "An uppercase letter"],
      [/[0-9]/, "A number"],
      [/[!@#$%^&*]/, "A special character (!@#$%^&*)"],
    ];

    if (password) {
      const failed = passwordRules.find(([re]) => !re.test(password));
      if (failed) errs.password = `Password requires: ${failed[1]}`;
    } else {
      errs.password = "Password is required";
    }

    if (confirmPassword !== password) errs.confirmPassword = "Passwords do not match";
    return errs;
  }

  // ── Form Submit Handler ──────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const errs = validateForm();
    setFieldErrs(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/register-owner", {
        ownerName: ownerName.trim(),
        ownerEmail: email.trim().toLowerCase(),
        ownerPhone: phone.trim(),
        salonName: salonName.trim(),
        salonDescription: salonDescription.trim() || undefined,
        password,
      });

      setSubmittedData(
        data.data?.request ?? {
          _id: "",
          ownerName: ownerName.trim(),
          ownerEmail: email.trim().toLowerCase(),
          salonName: salonName.trim(),
        }
      );
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      const first = parsed.errors?.[0]?.message;
      setError(first || parsed.message || "Failed to submit registration request.");
    } finally {
      setLoading(false);
    }
  }

  // ROI calculations
  const estimatedMonthlyBookings = dailyBookings * 30 * branchCount;
  const estimatedMonthlyRevenue = estimatedMonthlyBookings * avgTicketPrice;
  const estimatedTimeSavedHours = Math.round(branchCount * 18);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* ────────────────────────────────────────────────────────
          1. HEADER / NAVBAR
      ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-white tracking-tight">
                LUXE<span className="text-indigo-400">SALON</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                SaaS Partner Portal
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#benefits" className="hover:text-white transition-colors">
              Benefits
            </a>
            <a href="#guide" className="hover:text-white transition-colors">
              Panel Guide
            </a>
            <a href="#roi" className="hover:text-white transition-colors">
              ROI Calculator
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="http://localhost:3001/login"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-1.5"
            >
              Salon Panel Login <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="#register"
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-lg shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Register Salon
            </a>
          </div>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────
          2. HERO SECTION
      ──────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        {/* Background glow graphics */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Zap className="w-3.5 h-3.5 text-indigo-400" /> Multi-Branch Salon SaaS Platform
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Scale & Automate Your Salon Business with <span className="gradient-accent-text">Luxe SaaS</span>
          </h1>

          <p className="mt-6 text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            The complete management platform designed for modern salon owners. Streamline multi-branch operations, automate customer bookings, manage staff commissions & leave requests, and track revenue growth effortlessly.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#register"
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              Register Your Salon <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#guide"
              className="w-full sm:w-auto px-8 py-4 glass-card hover:bg-slate-800/60 text-slate-200 font-semibold rounded-xl border border-slate-700/80 flex items-center justify-center gap-2 transition-all"
            >
              Explore Panel Features
            </a>
          </div>

          {/* Key Stat Badges */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-card p-4 rounded-2xl text-center">
              <p className="text-2xl font-bold text-white">24 Hours</p>
              <p className="text-xs text-slate-400 mt-1">Fast Account Approval</p>
            </div>
            <div className="glass-card p-4 rounded-2xl text-center">
              <p className="text-2xl font-bold text-indigo-400">100% Real-Time</p>
              <p className="text-xs text-slate-400 mt-1">WebSocket Slot Updates</p>
            </div>
            <div className="glass-card p-4 rounded-2xl text-center">
              <p className="text-2xl font-bold text-teal-400">Multi-Branch</p>
              <p className="text-xs text-slate-400 mt-1">Centralized Control</p>
            </div>
            <div className="glass-card p-4 rounded-2xl text-center">
              <p className="text-2xl font-bold text-amber-400">Zero Setup</p>
              <p className="text-xs text-slate-400 mt-1">Free Onboarding</p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          3. PRODUCT BENEFITS
      ──────────────────────────────────────────────────────── */}
      <section id="benefits" className="py-20 px-6 bg-[#0b101d] border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">
              Why Salon Owners Choose Us
            </h2>
            <p className="font-display text-3xl sm:text-4xl font-bold text-white">
              Everything You Need to Run & Grow Your Salon
            </p>
            <p className="text-slate-400 text-sm mt-3">
              Designed to eliminate scheduling conflicts, automate staff workflows, and provide total operational clarity across all branches.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Benefit 1 */}
            <div className="glass-card p-7 rounded-2xl flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Multi-Branch Management</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Add and control multiple salon locations from one owner dashboard. Assign managers, customize operational hours, and set unique branch services.
                </p>
              </div>
              <ul className="mt-5 space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Location-based services & pricing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Branch-specific staff allocation</li>
              </ul>
            </div>

            {/* Benefit 2 */}
            <div className="glass-card p-7 rounded-2xl flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-5">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Automated Slot Booking</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Real-time slot availability algorithm automatically computes staff working hours, active leaves, and duration offsets to eliminate double bookings.
                </p>
              </div>
              <ul className="mt-5 space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Instant confirmation & status updates</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Dynamic reschedule & cancellation control</li>
              </ul>
            </div>

            {/* Benefit 3 */}
            <div className="glass-card p-7 rounded-2xl flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Staff & Leave Management</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Empower your team with staff roles. Staff members can request leaves which owners or managers approve, automatically blocking affected slots.
                </p>
              </div>
              <ul className="mt-5 space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Self-service leave requests</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Commission percentage calculations</li>
              </ul>
            </div>

            {/* Benefit 4 */}
            <div className="glass-card p-7 rounded-2xl flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-5">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Financial Reports & Insights</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Visual reporting dashboards break down revenue per branch, top-performing stylists, popular services, and daily appointment counts.
                </p>
              </div>
              <ul className="mt-5 space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-violet-400" /> Exportable revenue summaries</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-violet-400" /> Performance metrics per stylist</li>
              </ul>
            </div>

            {/* Benefit 5 */}
            <div className="glass-card p-7 rounded-2xl flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Real-Time WebSocket Alerts</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Never miss an update. Receive instant notifications on your panel whenever a client places a booking, requests a change, or cancels.
                </p>
              </div>
              <ul className="mt-5 space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-rose-400" /> In-app notification center</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-rose-400" /> Automated customer status notifications</li>
              </ul>
            </div>

            {/* Benefit 6 */}
            <div className="glass-card p-7 rounded-2xl flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Secure Multi-Tenant Platform</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Your salon data is completely isolated and protected with JWT token authentication, superadmin verification, and role-based access control.
                </p>
              </div>
              <ul className="mt-5 space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Admin-verified owner onboarding</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Role permissions (Owner, Manager, Staff)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          4. SALON PANEL USAGE GUIDE (STEP-BY-STEP & INTERACTIVE)
      ──────────────────────────────────────────────────────── */}
      <section id="guide" className="py-24 px-6 bg-[#090d16] relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">
              Onboarding & Usage Guide
            </h2>
            <p className="font-display text-3xl sm:text-4xl font-bold text-white">
              How the Salon Panel Works for You
            </p>
            <p className="text-slate-400 text-sm mt-3">
              Getting started takes just 4 simple steps. Explore how easy it is to manage your salon operations once approved.
            </p>
          </div>

          {/* 4 Step Process Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="glass-card p-6 rounded-2xl relative border-t-2 border-t-indigo-500">
              <span className="text-3xl font-black text-indigo-500/40 absolute top-4 right-5">01</span>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 font-bold text-sm">
                Step 1
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Self-Register</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fill out the owner registration form with your salon name, contact details, and password.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl relative border-t-2 border-t-teal-500">
              <span className="text-3xl font-black text-teal-500/40 absolute top-4 right-5">02</span>
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 font-bold text-sm">
                Step 2
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Superadmin Approval</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Platform admins review your registration for security and activate your salon account within 24 hours.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl relative border-t-2 border-t-amber-500">
              <span className="text-3xl font-black text-amber-500/40 absolute top-4 right-5">03</span>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 font-bold text-sm">
                Step 3
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Configure Salon</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log in to the Salon Panel, add your branches, set up hair/beauty services, and invite staff members.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl relative border-t-2 border-t-violet-500">
              <span className="text-3xl font-black text-violet-500/40 absolute top-4 right-5">04</span>
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4 font-bold text-sm">
                Step 4
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Accept & Grow</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive live customer appointments, manage daily schedules, approve staff leaves, and view revenue analytics.
              </p>
            </div>
          </div>

          {/* Interactive Salon Panel Simulator Showcase */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Interactive Panel Simulator</span>
                <h3 className="text-xl font-bold text-white mt-0.5">Explore the Salon Owner Workspace</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["dashboard", "bookings", "branches", "staff", "reports"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveGuideTab(tab)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                      activeGuideTab === tab
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-[#0e1424] rounded-2xl p-6 border border-slate-800/80 min-h-[300px]">
              {activeGuideTab === "dashboard" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <p className="text-sm font-semibold text-white">Salon Dashboard Overview</p>
                    <span className="text-xs text-slate-400">Live Status: Connected</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400">Today's Revenue</p>
                      <p className="text-2xl font-bold text-white mt-1">₹18,450</p>
                      <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">↑ 14% vs yesterday</p>
                    </div>
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400">Active Bookings</p>
                      <p className="text-2xl font-bold text-indigo-400 mt-1">16 Bookings</p>
                      <p className="text-[11px] text-slate-400 mt-1">4 pending confirmation</p>
                    </div>
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400">Active Staff Today</p>
                      <p className="text-2xl font-bold text-teal-400 mt-1">8 Stylists</p>
                      <p className="text-[11px] text-slate-400 mt-1">2 branches operating</p>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === "bookings" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <p className="text-sm font-semibold text-white">Live Booking Management</p>
                    <span className="text-xs text-indigo-400 font-medium">Real-Time Feed</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">Aria Sharma · Hair Styling & Highlights</p>
                        <p className="text-slate-400 mt-0.5">Time: 02:30 PM - 03:30 PM | Stylist: Rahul V.</p>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold rounded-md">PENDING</span>
                    </div>
                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">Rohan Gupta · Premium Facial & Beard Trim</p>
                        <p className="text-slate-400 mt-0.5">Time: 04:00 PM - 05:00 PM | Stylist: Vikram K.</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold rounded-md">CONFIRMED</span>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === "branches" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <p className="text-sm font-semibold text-white">Multi-Branch Locations</p>
                    <button className="text-xs bg-indigo-600 px-3 py-1.5 text-white font-medium rounded-lg">+ Add Branch</button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                      <p className="font-bold text-white text-sm">Downtown Luxury Salon</p>
                      <p className="text-xs text-slate-400 mt-1">Connaught Place, New Delhi</p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
                        <span>Staff: 6</span> • <span>Open: 09:00 AM - 08:00 PM</span>
                      </div>
                    </div>
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                      <p className="font-bold text-white text-sm">Westside Boutique Salon</p>
                      <p className="text-xs text-slate-400 mt-1">Bandra West, Mumbai</p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
                        <span>Staff: 4</span> • <span>Open: 10:00 AM - 09:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === "staff" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <p className="text-sm font-semibold text-white">Staff Management & Leave Requests</p>
                    <span className="text-xs text-slate-400">1 Pending Leave Request</span>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-white">Priya Sen (Senior Hair Specialist)</p>
                      <p className="text-slate-400 mt-0.5">Leave requested for: Aug 18, 2026 (Personal Leave)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 bg-emerald-600 text-white font-semibold rounded-md">Approve</button>
                      <button className="px-3 py-1 bg-rose-500/20 text-rose-300 font-semibold rounded-md">Reject</button>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === "reports" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <p className="text-sm font-semibold text-white">Revenue & Service Insights</p>
                    <span className="text-xs text-teal-400 font-medium">Monthly Breakdown</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Hair Styling & Coloring</span>
                        <span className="font-semibold text-white">₹1,45,000 (45%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[45%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Facials & Skincare</span>
                        <span className="font-semibold text-white">₹95,000 (30%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 w-[30%]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          5. ROI & REVENUE CALCULATOR
      ──────────────────────────────────────────────────────── */}
      <section id="roi" className="py-20 px-6 bg-[#0b101d] border-y border-slate-800/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-3">
              Growth Estimator
            </h2>
            <p className="font-display text-3xl font-bold text-white">
              Calculate Your Salon Revenue Growth
            </p>
            <p className="text-slate-400 text-sm mt-2">
              See how much time and money Luxe Salon SaaS saves your business each month.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl grid md:grid-cols-2 gap-8 items-center border border-slate-800">
            {/* Controls */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-300">Number of Salon Branches</span>
                  <span className="text-indigo-400 font-bold text-base">{branchCount}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={branchCount}
                  onChange={(e) => setBranchCount(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-300">Avg. Daily Bookings per Branch</span>
                  <span className="text-teal-400 font-bold text-base">{dailyBookings}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={dailyBookings}
                  onChange={(e) => setDailyBookings(Number(e.target.value))}
                  className="w-full accent-teal-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-300">Average Booking Value (₹)</span>
                  <span className="text-amber-400 font-bold text-base">₹{avgTicketPrice}</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="5000"
                  step="100"
                  value={avgTicketPrice}
                  onChange={(e) => setAvgTicketPrice(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated Output */}
            <div className="bg-[#0e1424] p-6 rounded-2xl border border-indigo-500/20 text-center space-y-5">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Estimated Monthly Volume</p>
                <p className="text-3xl font-extrabold text-white mt-1">{estimatedMonthlyBookings.toLocaleString()} Bookings</p>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Projected Monthly Revenue</p>
                <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400 mt-1">
                  ₹{estimatedMonthlyRevenue.toLocaleString()}
                </p>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Admin Time Saved</p>
                <p className="text-xl font-bold text-amber-400 mt-0.5">~{estimatedTimeSavedHours} Hours / Week</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          6. OWNER SELF-REGISTRATION FORM
      ──────────────────────────────────────────────────────── */}
      <section id="register" className="py-24 px-6 bg-[#090d16] relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Join Luxe Salon Platform
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white mt-2">
              Register Your Salon
            </h2>
            <p className="text-slate-400 text-sm mt-3 max-w-xl mx-auto">
              Submit your salon registration request below. Our platform admin team will review and activate your account within 24 hours.
            </p>
          </div>

          {submittedData ? (
            /* Success State Card */
            <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-emerald-500/30 text-center animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 mb-6">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Registration Request Submitted!
              </h3>
              <p className="text-sm text-slate-300 mt-3 max-w-md mx-auto leading-relaxed">
                Thank you, <span className="text-white font-semibold">{submittedData.ownerName}</span>. Your salon{" "}
                <span className="text-indigo-400 font-semibold">&ldquo;{submittedData.salonName}&rdquo;</span> is now queued for admin review.
              </p>

              <div className="mt-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-left max-w-md mx-auto space-y-3 text-xs text-slate-300">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">What happens next?</p>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <p>Superadmin verifies your salon details for platform security.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <p>Account approval is completed (usually within 24 hours).</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <p>
                    Log in to Salon Panel with email <span className="text-white font-medium">{submittedData.ownerEmail}</span>.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="http://localhost:3001/login"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
                >
                  Go to Salon Panel Login <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    setSubmittedData(null);
                    setSalonName("");
                    setOwnerName("");
                    setEmail("");
                    setPhone("");
                    setPassword("");
                    setConfirmPassword("");
                    setSalonDescription("");
                  }}
                  className="text-xs text-slate-400 hover:text-white underline py-2"
                >
                  Submit Another Registration
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Salon Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Salon Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. Luxe Hair & Beauty Studio"
                      value={salonName}
                      onChange={(e) => {
                        setSalonName(e.target.value);
                        setFieldErrs((p) => ({ ...p, salonName: "" }));
                      }}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {fieldErrs.salonName && <p className="text-[11px] text-rose-400 mt-1">{fieldErrs.salonName}</p>}
                </div>

                {/* Owner Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Owner Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. Ananya Roy"
                      value={ownerName}
                      onChange={(e) => {
                        setOwnerName(e.target.value);
                        setFieldErrs((p) => ({ ...p, ownerName: "" }));
                      }}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {fieldErrs.ownerName && <p className="text-[11px] text-rose-400 mt-1">{fieldErrs.ownerName}</p>}
                </div>

                {/* Owner Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setFieldErrs((p) => ({ ...p, phone: "" }));
                      }}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {fieldErrs.phone && <p className="text-[11px] text-rose-400 mt-1">{fieldErrs.phone}</p>}
                </div>

                {/* Owner Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      placeholder="owner@yoursalon.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrs((p) => ({ ...p, email: "" }));
                      }}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {fieldErrs.email && <p className="text-[11px] text-rose-400 mt-1">{fieldErrs.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Account Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrs((p) => ({ ...p, password: "", confirmPassword: "" }));
                      }}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {fieldErrs.password && <p className="text-[11px] text-rose-400 mt-1">{fieldErrs.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFieldErrs((p) => ({ ...p, confirmPassword: "" }));
                      }}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {fieldErrs.confirmPassword && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrs.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Salon Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Salon Description & Locations (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your salon, location(s), team size, and services offered..."
                  value={salonDescription}
                  onChange={(e) => setSalonDescription(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Password must be at least 8 characters with 1 uppercase, 1 number & 1 special character.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Submitting Request..."
                ) : (
                  <>
                    Submit Salon Registration <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          7. FAQ ACCORDION
      ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 bg-[#0b101d] border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
              Got Questions?
            </h2>
            <p className="font-display text-3xl font-bold text-white">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Why is my salon registration request held for admin approval?",
                a: "To ensure platform integrity and multi-tenant security, platform superadmins verify each new salon request before activating the owner account.",
              },
              {
                q: "Can I manage multiple salon branches under one owner account?",
                a: "Yes! Luxe Salon SaaS natively supports multi-branch management. Once approved, you can create and manage unlimited branch locations from your single owner panel.",
              },
              {
                q: "How do customer appointments work?",
                a: "Customers use the Customer Mobile/Web App to select a branch, pick an available service and stylist, and book available time slots in real time.",
              },
              {
                q: "How do staff leaves affect available appointment slots?",
                a: "When a staff member submits a leave request and it is approved by an owner or manager, affected time slots are automatically locked to prevent customer double-booking.",
              },
            ].map((faq, index) => (
              <div key={index} className="glass-card rounded-2xl overflow-hidden border border-slate-800">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between font-semibold text-sm text-white hover:text-indigo-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180 text-indigo-400" : "text-slate-500"
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          8. FOOTER
      ──────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 bg-[#070a11] border-t border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-white text-base tracking-tight">
              LUXE<span className="text-indigo-400">SALON</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-6 text-slate-400">
            <a href="#benefits" className="hover:text-white transition-colors">Benefits</a>
            <a href="#guide" className="hover:text-white transition-colors">Panel Guide</a>
            <a href="#roi" className="hover:text-white transition-colors">ROI Calculator</a>
            <a href="#register" className="hover:text-white transition-colors">Register Salon</a>
            <a href="http://localhost:3001/login" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Salon Panel Login</a>
          </div>

          <p className="text-slate-500">© 2026 LUXE SALON PLATFORM. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
