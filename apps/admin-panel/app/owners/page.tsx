"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import { Search, RefreshCw } from "lucide-react";

interface Owner {
  _id: string;
  name: string;
  email: string;
  phone: string;
  salonId: { _id: string; name: string; isActive: boolean } | null;
  isActive: boolean;
  createdAt: string;
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOwners = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/owners");
      setOwners(data.data?.owners || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  const filtered = owners.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleOwner(id: string, isActive: boolean) {
    if (isActive && !confirm("Deactivating this owner will also deactivate their salon. Continue?")) return;
    try {
      if (isActive) await apiClient.delete(`/admin/owners/${id}`);
      else await apiClient.patch(`/admin/owners/${id}`, { isActive: true });
      fetchOwners();
    } catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Owners</h1>
          <p className="text-[13px] text-muted mt-1">{filtered.length} salon owners</p>
        </div>
        <button onClick={fetchOwners} className="px-3 py-2 text-[12px] text-slate hover:text-ink bg-white border border-border rounded-lg flex items-center gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="max-w-md relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search owners..."
          className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
      </div>

      {loading ? (
        <p className="text-center text-muted py-12 text-[13px]">Loading...</p>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-subtle">
                {["Owner", "Email", "Phone", "Salon", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left font-medium text-slate px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o._id} className="border-b border-border/50 hover:bg-subtle/50">
                  <td className="px-5 py-3.5 font-medium">{o.name}</td>
                  <td className="px-5 py-3.5 text-slate">{o.email}</td>
                  <td className="px-5 py-3.5 text-slate">{o.phone || "—"}</td>
                  <td className="px-5 py-3.5">
                    {o.salonId ? (
                      <span className="text-[12px]">{o.salonId.name}</span>
                    ) : (
                      <span className="text-[12px] text-muted">No salon</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${o.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                      {o.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleOwner(o._id, o.isActive)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-md ${o.isActive ? "text-danger bg-danger/5 hover:bg-danger/10" : "text-success bg-success/5 hover:bg-success/10"}`}>
                      {o.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}