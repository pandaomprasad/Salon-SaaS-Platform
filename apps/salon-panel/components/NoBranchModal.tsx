"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useRouter, usePathname } from "next/navigation";
import apiClient from "@/lib/api-client";
import { Building2, ArrowRight, X } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NoBranchModal() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, salon } = useSelector((state: RootState) => state.auth);

  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Only prompt salon owners on protected routes
    if (!user || user.role !== "owner") return;

    // Skip on login/register pages
    if (["/", "/login", "/register"].includes(pathname)) return;

    const dismissed = sessionStorage.getItem("no_branch_prompt_dismissed");
    if (dismissed) return;

    const salonId = salon?._id;
    if (!salonId) return;

    async function checkBranches() {
      setChecking(true);
      try {
        const { data } = await apiClient.get(`/salons/${salonId}/branches`);
        const list = data.data?.branches || data.data || [];
        if (Array.isArray(list) && list.length === 0) {
          setOpen(true);
        }
      } catch {
        // silent fail
      } finally {
        setChecking(false);
      }
    }

    checkBranches();
  }, [user, salon, pathname]);

  if (!open || checking) return null;

  function handleAccept() {
    setOpen(false);
    sessionStorage.setItem("no_branch_prompt_dismissed", "true");

    if (pathname === "/branches") {
      window.dispatchEvent(new Event("open-add-branch-modal"));
    } else {
      router.push("/branches?addBranch=true");
    }
  }

  function handleDismiss() {
    setOpen(false);
    sessionStorage.setItem("no_branch_prompt_dismissed", "true");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-border animate-slide-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted hover:text-ink transition-colors p-1 rounded-lg hover:bg-subtle"
          title="Dismiss"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mb-4">
            <Building2 size={28} />
          </div>

          <h3 className="font-semibold text-lg text-ink">No Branch Registered</h3>
          <p className="text-[13px] text-slate mt-2 leading-relaxed max-w-sm">
            Welcome to Luxe Salon! You haven&apos;t registered any branch for your salon yet. Would you like to register a branch first?
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 w-full">
            <Button
              className="flex-1 h-11 text-xs font-semibold rounded-xl"
              icon={<ArrowRight size={14} />}
              onClick={handleAccept}
            >
              Yes, Register Branch Now
            </Button>
            <Button
              variant="secondary"
              className="h-11 text-xs font-medium rounded-xl"
              onClick={handleDismiss}
            >
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
