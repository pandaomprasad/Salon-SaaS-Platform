// ============================================================
// app/register/page.tsx — Salon owner self-registration.
// Submits a PENDING request; admin approves before owner can log in.
// ============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  Mail,
  Lock,
  AlertCircle,
  User,
  Building2,
  Phone,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { registerOwner } from "@/api/services/authService";
import { parseApiError } from "@/lib/api-client";

const EMAIL_RE = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export default function RegisterPage() {
  const router = useRouter();

  const [salonName, setSalonName] = useState("");
  const [salonDescription, setSalonDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | {
    _id: string;
    ownerName: string;
    ownerEmail: string;
    salonName: string;
  }>(null);

  const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({});

  function fieldErrors(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (salonName.trim().length < 2) errs.salonName = "Salon name is required";
    if (ownerName.trim().length < 2) errs.ownerName = "Owner name must be at least 2 characters";
    if (!EMAIL_RE.test(email.trim())) errs.email = "Enter a valid email address";
    if (!phone.trim()) errs.phone = "Phone number is required";
    const passwordRules: [RegExp, string][] = [
      [/^.{8,}$/, "At least 8 characters"],
      [/[A-Z]/, "An uppercase letter"],
      [/[0-9]/, "A number"],
      [/[!@#$%^&*]/, "A special character (!@#$%^&*)"],
    ];
    if (password) {
      const failed = passwordRules.find(([re]) => !re.test(password));
      if (failed) errs.password = `Password needs: ${failed[1]}`;
    }
    if (confirm !== password) errs.confirm = "Passwords do not match";
    return errs;
  }

  async function handleSubmit(): Promise<void> {
    setError("");
    const errs = fieldErrors();
    setFieldErrs(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await registerOwner({
        ownerName: ownerName.trim(),
        ownerEmail: email.trim().toLowerCase(),
        ownerPhone: phone.trim(),
        salonName: salonName.trim(),
        salonDescription: salonDescription.trim() || undefined,
        password,
      });
      setDone(res.data?.request ?? {
        _id: "",
        ownerName: ownerName.trim(),
        ownerEmail: email.trim().toLowerCase(),
        salonName: salonName.trim(),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      const first = parsed.errors?.[0]?.message;
      setError(first || parsed.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  // ── Success state ──────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-lg relative animate-slide-up text-center">
          <div className="flex items-center justify-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <p className="font-display text-2xl text-ink">Luxe Salon</p>
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-border/50">
            <div className="mx-auto w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
              <CheckCircle2 size={26} />
            </div>
            <h1 className="font-display text-3xl text-ink">Request submitted!</h1>
            <p className="text-[13px] text-slate mt-3 leading-relaxed">
              Thanks, <span className="font-semibold text-ink">{done.ownerName}</span>. Your salon{" "}
              <span className="font-semibold text-ink">&ldquo;{done.salonName}&rdquo;</span> has been
              queued for review. Our team will verify your registration and activate your owner
              account — usually within 24 hours.
            </p>

            <div className="mt-7 bg-subtle border border-border/60 rounded-xl p-4 text-left space-y-1.5">
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider">What happens next</p>
              <p className="text-[12.5px] text-slate">
                1. Platform admin reviews your request
              </p>
              <p className="text-[12.5px] text-slate">
                2. Your owner account & salon are activated
              </p>
              <p className="text-[12.5px] text-slate">
                3. You receive access — then sign in with{" "}
                <span className="text-ink font-medium">{done.ownerEmail}</span>
              </p>
            </div>

            <Button
              className="w-full h-12 text-sm font-semibold rounded-xl mt-8"
              size="lg"
              onClick={() => router.push("/login")}
              icon={<ArrowRight size={15} />}
            >
              Go to Salon Panel Login
            </Button>
          </div>

          <p className="text-center mt-8 text-[11px] text-muted/60 font-medium">
            © 2026 LUXE SALON PLATFORM. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    );
  }

  // ── Form state ────────────────────────────
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl relative animate-slide-up">
        {/* Branding */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
          </Link>
          <p className="text-[11px] tracking-[0.4em] text-muted uppercase mb-3 animate-fade-in [animation-delay:100ms] opacity-0">
            Salon Owner Registration
          </p>
          <h1 className="font-display text-4xl text-ink mb-2 animate-fade-in [animation-delay:200ms] opacity-0">
            Open your salon&apos;s account
          </h1>
          <p className="text-[12.5px] text-slate animate-fade-in [animation-delay:300ms] opacity-0">
            Takes 2 minutes — our team activates your account within 24 hours.
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-border/50 backdrop-blur-sm animate-fade-in [animation-delay:400ms] opacity-0">
          <div className="grid md:grid-cols-2 gap-5" onKeyDown={handleKeyDown}>
            <div className="space-y-5">
              <Input
                label="Salon Name"
                placeholder="Luxe Salon"
                value={salonName}
                onChange={(e) => {
                  setSalonName(e.target.value);
                  setError("");
                  setFieldErrs((p) => ({ ...p, salonName: "" }));
                }}
                icon={<Building2 size={16} className="text-muted/60" />}
                error={fieldErrs.salonName}
                className="h-11 text-sm rounded-xl"
              />
              <Input
                label="Owner Full Name"
                placeholder="Aria Mehta"
                value={ownerName}
                onChange={(e) => {
                  setOwnerName(e.target.value);
                  setError("");
                  setFieldErrs((p) => ({ ...p, ownerName: "" }));
                }}
                icon={<User size={16} className="text-muted/60" />}
                error={fieldErrs.ownerName}
                className="h-11 text-sm rounded-xl"
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                  setFieldErrs((p) => ({ ...p, phone: "" }));
                }}
                icon={<Phone size={16} className="text-muted/60" />}
                error={fieldErrs.phone}
                className="h-11 text-sm rounded-xl"
              />
            </div>

            <div className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="owner@yoursalon.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                  setFieldErrs((p) => ({ ...p, email: "" }));
                }}
                icon={<Mail size={16} className="text-muted/60" />}
                error={fieldErrs.email}
                className="h-11 text-sm rounded-xl"
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                  setFieldErrs((p) => ({ ...p, password: "", confirm: "" }));
                }}
                icon={<Lock size={16} className="text-muted/60" />}
                error={fieldErrs.password}
                className="h-11 text-sm rounded-xl"
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError("");
                  setFieldErrs((p) => ({ ...p, confirm: "" }));
                }}
                icon={<Lock size={16} className="text-muted/60" />}
                error={fieldErrs.confirm}
                className="h-11 text-sm rounded-xl"
              />
            </div>
          </div>

          <div className="mt-5">
            <Textarea
              label="About your salon (optional)"
              placeholder="Location, services offered, team size — anything that helps us verify your salon faster."
              value={salonDescription}
              onChange={(e) => setSalonDescription(e.target.value)}
              className="text-sm rounded-xl min-h-[88px]"
            />
          </div>

          <p className="text-[10.5px] text-muted mt-4 leading-relaxed">
            Password must be at least 8 characters and include an uppercase letter, a number and a
            special character (!@#$%^&amp;*).
          </p>

          {error && (
            <div className="flex items-center gap-2.5 text-danger bg-danger/5 border border-danger/10 rounded-xl px-4 py-3 mt-5 animate-slide-in">
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          <Button
            className="w-full h-12 text-sm font-semibold rounded-xl mt-6"
            size="lg"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            {loading ? "Submitting request..." : "Submit Registration Request"}
          </Button>

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-[12px] text-slate">
              Already registered?{" "}
              <Link href="/login" className="text-accent font-semibold hover:underline">
                Sign in to the salon panel
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-10 text-[11px] text-muted/60 font-medium">
          © 2026 LUXE SALON PLATFORM. ALL RIGHTS RESERVED.
        </p>
      </div>
    </div>
  );
}