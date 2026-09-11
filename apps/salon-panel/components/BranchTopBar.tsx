"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { selectBranch } from "@/store/slices/authSlice";
import apiClient from "@/lib/api-client";
import { MapPin, ChevronDown, Check, AlertCircle, Bell } from "lucide-react";

interface BranchOption {
  _id: string;
  name: string;
  isActive?: boolean;
  deactivatedByAdmin?: boolean;
  adminDeactivationReason?: string;
  address?: { city: string; state: string };
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
    if (!role) return;

    async function fetchBranches() {
      setLoading(true);
      try {
        const salonId = salon?._id;
        if (!salonId) return;

        const { data } = await apiClient.get(`/salons/${salonId}/branches`);
        const list: BranchOption[] = data.data?.branches || data.data || [];
        setBranches(list);

        // Auto-select first branch if none selected and branches exist
        if (!selectedBranch && list.length > 0) {
          const first = list[0];
          dispatch(
            selectBranch({
              _id: first._id,
              name: first.name,
              isActive: first.isActive,
              deactivatedByAdmin: first.deactivatedByAdmin,
              adminDeactivationReason: first.adminDeactivationReason,
            })
          );
        } else if (selectedBranch) {
          // Sync active status of currently selected branch
          const current = list.find((b) => b._id === selectedBranch._id);
          if (current) {
            dispatch(
              selectBranch({
                _id: current._id,
                name: current.name,
                isActive: current.isActive,
                deactivatedByAdmin: current.deactivatedByAdmin,
                adminDeactivationReason: current.adminDeactivationReason,
              })
            );
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    fetchBranches();
  }, [role, salon, dispatch]);

  // Don't render dropdown UI for staff role, but sync branch status in Redux above
  if (role !== "owner" && role !== "manager") return null;

  // Show a subtle loading state while branches load
  if (loading && !selectedBranch) return null;

  // Don't show if no branches available
  if (!loading && branches.length === 0) return null;

  return (
    <div className="relative">
      <div className="h-12 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <MapPin size={16} className="text-[#5542f6]" />
          <span className="text-slate-500 font-normal">Branch:</span>
          <span className="font-bold text-slate-900">
            {selectedBranch?.name || "Ramesh salon"}
          </span>
          {selectedBranch && selectedBranch.isActive === false && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-600 border border-rose-200 flex items-center gap-1 uppercase tracking-wider">
              <AlertCircle size={10} /> Inactive
            </span>
          )}
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Right Header Controls matching reference design */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-500 hidden md:inline">
            Friday, 11 September 2026
          </span>
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
              <Bell size={16} />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white">
              1
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "R"}
          </div>
        </div>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-5 mt-1 bg-white border border-border rounded-lg shadow-lg shadow-black/5 z-50 w-72 py-1 animate-slide-up">
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
              const isSelected = b._id === selectedBranch?._id;
              const isBranchInactive = b.isActive === false;
              return (
                <button
                  key={b._id}
                  onClick={() => {
                    dispatch(
                      selectBranch({
                        _id: b._id,
                        name: b.name,
                        isActive: b.isActive,
                        deactivatedByAdmin: b.deactivatedByAdmin,
                        adminDeactivationReason: b.adminDeactivationReason,
                      })
                    );
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-accent/5" : "hover:bg-subtle"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-[12px] font-medium ${isSelected ? "text-accent" : "text-ink"}`}>
                        {b.name}
                      </p>
                      {isBranchInactive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-danger/10 text-danger uppercase">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted mt-0.5">
                      {b.address?.city ? `${b.address.city}, ${b.address.state || ""}` : "No location"}
                    </p>
                  </div>
                  {isSelected && <Check size={13} className="text-accent shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}