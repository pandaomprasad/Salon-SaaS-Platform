"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { selectBranch } from "@/store/slices/authSlice";
import apiClient from "@/lib/api-client";
import { MapPin } from "lucide-react";

interface BranchOption {
  _id: string;
  name: string;
  address: {
    city: string;
    state: string;
  };
}

export default function BranchSelectorModal() {
  const dispatch = useDispatch();
  const { user, salon, selectedBranch } = useSelector((state: RootState) => state.auth);

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  const role = user?.role;

  useEffect(() => {
    // Only show for owner who hasn't selected a branch yet
    if (role !== "owner" || selectedBranch) return;

    const salonId = salon?._id;
    if (!salonId) return;

    async function fetchBranches() {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/salons/${salonId}/branches`);
        const list = data.data?.branches || data.data || [];
        setBranches(list);

        if (list.length === 1) {
          // Auto-select if only one branch
          dispatch(selectBranch({ _id: list[0]._id, name: list[0].name }));
        } else if (list.length > 1) {
          setShow(true);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    fetchBranches();
  }, [role, salon, selectedBranch, dispatch]);

  if (!show || branches.length === 0) return null;

  function handleSelect(branch: BranchOption) {
    dispatch(selectBranch({ _id: branch._id, name: branch.name }));
    setShow(false);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-ink/50 flex items-center justify-center p-6">
      <div className="bg-paper rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="px-6 pt-8 pb-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ash mb-2">Welcome back</p>
          <h2 className="font-display text-2xl text-ink">Select a Branch</h2>
          <p className="text-xs text-ash mt-2">Choose which branch you'd like to manage</p>
          <div className="w-8 h-px bg-gold mx-auto mt-4" />
        </div>

        {/* Branch list */}
        <div className="p-4 space-y-2">
          {branches.map((b) => (
            <button
              key={b._id}
              onClick={() => handleSelect(b)}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all hover:bg-smoke/50 border border-transparent hover:border-smoke group"
            >
              <div className="w-10 h-10 rounded-xl bg-smoke text-ink flex items-center justify-center shrink-0 group-hover:bg-ink group-hover:text-white transition-colors">
                <MapPin size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-ink">{b.name}</p>
                <p className="text-[11px] text-ash">
                  {b.address?.city}, {b.address?.state}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 pt-2">
          <p className="text-[10px] text-ash text-center">
            You can switch branches anytime from the top bar
          </p>
        </div>
      </div>
    </div>
  );
}