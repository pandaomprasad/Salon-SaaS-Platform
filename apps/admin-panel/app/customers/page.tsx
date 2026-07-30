"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import { Search, RefreshCw } from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/customers");
      setCustomers(data.data?.customers || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Customers</h1>
          <p className="text-[13px] text-muted mt-1">{filtered.length} registered customers</p>
        </div>
        <button onClick={fetchCustomers} className="px-3 py-2 text-[12px] text-slate hover:text-ink bg-white border border-border rounded-lg flex items-center gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="max-w-md relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or phone..."
          className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
      </div>

      {loading ? (
        <p className="text-center text-muted py-12 text-[13px]">Loading...</p>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-subtle">
                {["Customer", "Email", "Phone", "Joined", "Status"].map((h) => (
                  <th key={h} className="text-left font-medium text-slate px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted py-12">No customers found.</td></tr>
              ) : filtered.map((c) => (
                <tr key={c._id} className="border-b border-border/50 hover:bg-subtle/50">
                  <td className="px-5 py-3.5 font-medium">{c.name}</td>
                  <td className="px-5 py-3.5 text-slate">{c.email}</td>
                  <td className="px-5 py-3.5 text-slate">{c.phone || "—"}</td>
                  <td className="px-5 py-3.5 text-slate">{formatDate(c.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${c.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
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