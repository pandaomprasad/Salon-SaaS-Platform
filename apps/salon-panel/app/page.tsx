// ============================================================
// app/page.tsx — Public landing page for salon owners
// Logged-in users are sent straight to the dashboard.
// ============================================================

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import Link from "next/link";
import {
  CalendarCheck,
  Users,
  Sparkles,
  BarChart3,
  Clock,
  Bell,
  ArrowRight,
  ShieldCheck,
  Star,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Bookings & Appointments",
    description:
      "Approve, reschedule and track every booking. Real-time slot management across all your branches.",
  },
  {
    icon: Users,
    title: "Staff Management",
    description:
      "Onboard managers and stylists, assign permissions, manage leaves and availability from one place.",
  },
  {
    icon: Sparkles,
    title: "Services Catalog",
    description:
      "Build your menu with prices, durations and eligible staff — then publish it for instant bookings.",
  },
  {
    icon: Clock,
    title: "Smart Slot Generation",
    description:
      "Auto-generate daily slots from your operating hours and block busy times in bulk in seconds.",
  },
  {
    icon: BarChart3,
    title: "Reports & Insights",
    description:
      "Revenue, popular services, staff performance and slot utilization — know exactly what drives growth.",
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    description:
      "Get notified the moment a booking lands or a staff member requests leave. Never miss a beat.",
  },
];

const TESTIMONIALS = [
  {
    name: "Aria Mehta",
    salon: "Luxe Salon, Pune",
    quote:
      "We went from paper registers to a fully digital studio. Bookings, staff and reports in one dashboard.",
  },
  {
    name: "Kabir Shah",
    salon: "Glam House, Mumbai",
    quote:
      "Slot management alone saves us hours every week. Our stylists actually love using it.",
  },
  {
    name: "Sanya Rao",
    salon: "Blush Studio, Bengaluru",
    quote:
      "The approval process was quick and the team supported us at every step. Worth every minute.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (!isLoading && user) return null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ─────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <p className="font-display text-lg text-ink">Luxe Salon</p>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium">
            <button onClick={() => scrollTo("features")} className="text-slate hover:text-ink transition-colors">
              Features
            </button>
            <button onClick={() => scrollTo("how")} className="text-slate hover:text-ink transition-colors">
              How it works
            </button>
            <button onClick={() => scrollTo("testimonials")} className="text-slate hover:text-ink transition-colors">
              Stories
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] font-semibold text-slate hover:text-ink px-4 py-2 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-[13px] font-semibold text-white bg-primary hover:bg-charcoal px-4 py-2 rounded-lg shadow-sm shadow-primary/10 transition-colors"
            >
              Get Started
            </Link>
          </div>

          <button
            className="md:hidden text-ink p-1.5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border/60 bg-white px-6 py-4 space-y-1 animate-slide-up">
            {[
              { label: "Features", id: "features" },
              { label: "How it works", id: "how" },
              { label: "Stories", id: "testimonials" },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="block w-full text-left px-3 py-2.5 text-[13px] font-medium text-slate hover:bg-subtle rounded-lg"
              >
                {l.label}
              </button>
            ))}
            <div className="flex gap-3 pt-3">
              <Link
                href="/login"
                className="flex-1 text-center text-[13px] font-semibold text-ink border border-border px-4 py-2.5 rounded-lg"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex-1 text-center text-[13px] font-semibold text-white bg-primary px-4 py-2.5 rounded-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ──────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-[-10%] w-[45%] h-[45%] bg-accent/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-[-10%] w-[35%] h-[35%] bg-accent/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-[11px] tracking-[0.35em] text-accent uppercase font-semibold mb-5 animate-fade-in">
              Salon Management Platform
            </p>
            <h1 className="font-display text-[44px] leading-[1.05] md:text-[56px] text-ink animate-slide-up">
              Run your salon like a <span className="italic text-accent">pro</span>, from anywhere.
            </h1>
            <p className="mt-6 text-[15px] text-slate leading-relaxed max-w-lg animate-fade-in [animation-delay:150ms] opacity-0">
              Luxe Salon gives owners one dashboard for bookings, staff, services and revenue —
              so you can focus on your craft, not the admin.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in [animation-delay:250ms] opacity-0">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3.5 rounded-xl text-[13px] font-semibold shadow-sm shadow-primary/10 hover:bg-charcoal transition-colors"
              >
                Create your account <ArrowRight size={15} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white border border-border text-ink px-6 py-3.5 rounded-xl text-[13px] font-semibold hover:bg-subtle transition-colors"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-8 animate-fade-in [animation-delay:350ms] opacity-0">
              <div>
                <p className="text-2xl font-semibold text-ink font-display">500+</p>
                <p className="text-[11px] text-muted mt-0.5">Salons onboarded</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-2xl font-semibold text-ink font-display">40k+</p>
                <p className="text-[11px] text-muted mt-0.5">Bookings managed</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-2xl font-semibold text-ink font-display">
                  4.9 <Star size={13} className="inline text-warning fill-warning -mt-1" />
                </p>
                <p className="text-[11px] text-muted mt-0.5">Owner rating</p>
              </div>
            </div>
          </div>

          {/* Mock dashboard preview */}
          <div className="relative animate-slide-up [animation-delay:200ms]">
            <div className="rounded-2xl border border-border bg-white shadow-[0_32px_64px_-16px_rgba(15,23,42,0.12)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <p className="text-[12px] font-semibold text-ink">Today&apos;s Bookings</p>
                </div>
                <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-md">LIVE</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Revenue", value: "₹12,450", accent: false },
                  { label: "Booked", value: "38", accent: false },
                  { label: "Stylists", value: "9", accent: false },
                ].map((s) => (
                  <div key={s.label} className="bg-subtle rounded-xl p-3">
                    <p className="text-[10px] text-muted">{s.label}</p>
                    <p className="text-[15px] font-semibold text-ink mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {[
                  { name: "Hair Color + Cut", time: "10:30", staff: "Jade", price: "₹1,200" },
                  { name: "Keratin Treatment", time: "11:00", staff: "Marco", price: "₹2,400" },
                  { name: "Facial & Cleanup", time: "11:45", staff: "Aria", price: "₹850" },
                ].map((b) => (
                  <div key={b.time} className="flex items-center gap-3 border border-border/60 rounded-xl px-3.5 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                      <CalendarCheck size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-ink truncate">{b.name}</p>
                      <p className="text-[10px] text-muted">with {b.staff}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-ink">{b.time}</span>
                    <span className="text-[11px] text-slate hidden sm:block">{b.price}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 rounded-xl border border-border bg-white shadow-lg px-4 py-3 flex items-center gap-3 animate-slide-up [animation-delay:450ms]">
              <div className="w-7 h-7 rounded-lg bg-success/10 text-success flex items-center justify-center">
                <ShieldCheck size={14} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-ink">New booking received</p>
                <p className="text-[10px] text-muted">just now · Saurabh P.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────── */}
      <section id="features" className="bg-surface border-y border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[11px] tracking-[0.35em] text-accent uppercase font-semibold mb-4">
              Everything included
            </p>
            <h2 className="font-display text-3xl md:text-[40px] text-ink">
              One platform. <span className="italic text-accent">Every</span> moving part of your salon.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-border rounded-2xl p-6 hover:shadow-[0_16px_32px_-12px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                  <f.icon size={18} />
                </div>
                <h3 className="text-[15px] font-semibold text-ink">{f.title}</h3>
                <p className="text-[12.5px] text-slate leading-relaxed mt-1.5">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────── */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[11px] tracking-[0.35em] text-accent uppercase font-semibold mb-4">
            Getting started
          </p>
          <h2 className="font-display text-3xl md:text-[40px] text-ink">
            Live in <span className="italic text-accent">three</span> simple steps.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Submit your request",
              description:
                "Tell us about you and your salon. It takes less than two minutes.",
            },
            {
              step: "02",
              title: "We verify your salon",
              description:
                "Our team reviews your registration and activates your owner account.",
            },
            {
              step: "03",
              title: "Log in & take control",
              description:
                "Sign in to the salon panel and start managing bookings, staff and revenue.",
            },
          ].map((s) => (
            <div key={s.step} className="relative bg-white border border-border rounded-2xl p-7">
              <p className="font-display text-4xl text-accent/25">{s.step}</p>
              <h3 className="text-[15px] font-semibold text-ink mt-3">{s.title}</h3>
              <p className="text-[12.5px] text-slate leading-relaxed mt-1.5">{s.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-xl text-[13px] font-semibold shadow-sm shadow-primary/10 hover:bg-charcoal transition-colors"
          >
            Register your salon <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────── */}
      <section id="testimonials" className="bg-surface border-y border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[11px] tracking-[0.35em] text-accent uppercase font-semibold mb-4">
              Owner stories
            </p>
            <h2 className="font-display text-3xl md:text-[40px] text-ink">
              Trusted by salon owners <span className="italic text-accent">across India</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white border border-border rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-[13px] text-slate leading-relaxed italic">“{t.quote}”</p>
                <div className="mt-5 pt-5 border-t border-border/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[11px] font-bold">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-ink">{t.name}</p>
                    <p className="text-[10.5px] text-muted">{t.salon}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 md:px-14 md:py-16 text-center">
          <div className="absolute -top-20 right-0 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 left-0 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-[42px] text-white">
              Ready to give your salon a <span className="italic text-accent-lt">growth engine?</span>
            </h2>
            <p className="text-[13.5px] text-white/70 mt-4 max-w-md mx-auto">
              Join hundreds of salon owners who run their business on Luxe Salon. Approval usually takes less than 24 hours.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-accent text-white px-7 py-3.5 rounded-xl text-[13px] font-semibold hover:bg-accent/90 transition-colors"
              >
                Register your salon <ArrowRight size={15} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 px-7 py-3.5 rounded-xl text-[13px] font-semibold hover:bg-white/15 transition-colors"
              >
                Sign in to the panel
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────── */}
      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <p className="font-display text-[15px] text-ink">Luxe Salon</p>
          </div>
          <div className="flex items-center gap-6 text-[11px] text-muted">
            <Link href="/login" className="hover:text-ink transition-colors">Salon Panel Login</Link>
            <Link href="/register" className="hover:text-ink transition-colors">Register a Salon</Link>
            <span>&copy; 2026 Luxe Salon Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}