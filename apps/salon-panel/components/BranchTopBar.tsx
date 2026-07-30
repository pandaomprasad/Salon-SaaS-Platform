"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { selectBranch } from "@/store/slices/authSlice";
import apiClient from "@/lib/api-client";
import { MapPin, ChevronDown, Check } from "lucide-react";

interface BranchOption {
  _id: string;
  name: string;
  address: { city: string; state: string };
}

export default function BranchTopBar() {
  const dispatch = useDispatch();
  const { user, salon, selectedBranch } = useSelector((state: RootState) => state.auth);

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const role = user?.role;

  // Fetch branches from the API using the salon from Redux
  useEffect(() => {
    if (role !== "owner" && role !== "manager") return;

    async function fetchBranches() {
      setLoading(true);
      try {
        const salonId = salon?._id;
        if (!salonId) return;

        const { data } = await apiClient.get(`/salons/${salonId}/branches`);
        const list = data.data?.branches || data.data || [];
        setBranches(list);

        // Auto-select first branch if none selected and branches exist
        if (!selectedBranch && list.length > 0) {
          dispatch(selectBranch({ _id: list[0]._id, name: list[0].name }));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    fetchBranches();
  }, [role, salon, dispatch, selectedBranch]);

  // Don't render for non-owner/manager roles
  if (role !== "owner" && role !== "manager") return null;

  // Show a subtle loading state while branches load
  if (loading && !selectedBranch) return null;

  // Don't show if no branches available
  if (!loading && branches.length === 0) return null;

  return (
    <div className="relative">
      <div className="h-11 bg-white border-b border-border px-5 flex items-center">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-[12px] text-slate hover:text-ink transition-colors"
        >
          <MapPin size={12} className="text-accent" />
          <span className="text-muted">Branch:</span>
          <span className="font-medium text-ink">
            {selectedBranch?.name || "Select Branch"}
          </span>
          <ChevronDown size={12} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-5 mt-1 bg-white border border-border rounded-lg shadow-lg shadow-black/5 z-50 w-64 py-1 animate-slide-up">
            {/* "All Branches" option for owners */}
            {role === "owner" && (
              <button
                onClick={() => {
                  dispatch(selectBranch(null));
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  !selectedBranch ? "bg-accent/5" : "hover:bg-subtle"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-medium ${!selectedBranch ? "text-accent" : "text-ink"}`}>
                    All Branches
                  </p>
                  <p className="text-[10px] text-muted">View bookings across all branches</p>
                </div>
                {!selectedBranch && <Check size={13} className="text-accent shrink-0" />}
              </button>
            )}

            {role === "owner" && <div className="border-t border-border/50 my-1" />}

            {branches.map((b) => {
              const isActive = b._id === selectedBranch?._id;
              return (
                <button
                  key={b._id}
                  onClick={() => {
                    dispatch(selectBranch({ _id: b._id, name: b.name }));
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isActive ? "bg-accent/5" : "hover:bg-subtle"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-medium ${isActive ? "text-accent" : "text-ink"}`}>
                      {b.name}
                    </p>
                    <p className="text-[10px] text-muted">{b.address?.city}, {b.address?.state}</p>
                  </div>
                  {isActive && <Check size={13} className="text-accent shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}