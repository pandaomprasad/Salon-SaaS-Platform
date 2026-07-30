"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { TrendingUp, Building2, Users, CalendarDays, RefreshCw } from "lucide-react";

interface GrowthItem {
  month: string;
  newSalons: number;
  newCustomers: number;
  newAppointments: number;
}

export default function GrowthPage() {
  const [growth, setGrowth] = useState<GrowthItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchGrowth() {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/growth");
      setGrowth(data.data?.growth || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { fetchGrowth(); }, []);

  const totals = growth.reduce((acc, g) => ({
    salons: acc.salons + g.newSalons,
    customers: acc.customers + g.newCustomers,
    appointments: acc.appointments + g.newAppointments,
  }), { salons: 0, customers: 0, appointments: 0 });

  const maxVal = Math.max(...growth.map((g) => Math.max(g.newSalons, g.newCustomers, g.newAppointments)), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Growth Analytics</h1>
          <p className="text-[13px] text-muted mt-1">Platform growth over the last 6 months</p>
        </div>
        <button onClick={fetchGrowth} className="px-3 py-2 text-[12px] text-slate hover:text-ink bg-white border border-border rounded-lg flex items-center gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center mb-3"><Building2 size={15} /></div>
          <p className="text-2xl font-semibold">{totals.salons}</p>
          <p className="text-[12px] text-muted">New salons (6 months)</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="w-8 h-8 rounded-lg bg-pink-500 text-white flex items-center justify-center mb-3"><Users size={15} /></div>
          <p className="text-2xl font-semibold">{totals.customers}</p>
          <p className="text-[12px] text-muted">New customers (6 months)</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center mb-3"><CalendarDays size={15} /></div>
          <p className="text-2xl font-semibold">{totals.appointments}</p>
          <p className="text-[12px] text-muted">Appointments (6 months)</p>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <p className="text-center text-muted py-12">Loading...</p>
      ) : (
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-[15px] font-semibold mb-6">Monthly Breakdown</h2>
          <div className="space-y-5">
            {growth.map((g) => (
              <div key={g.month}>
                <p className="text-[12px] font-medium text-slate mb-2">{g.month}</p>
                <div className="space-y-1.5">
                  <MetricBar label="Salons" value={g.newSalons} max={maxVal} color="bg-blue-500" />
                  <MetricBar label="Customers" value={g.newCustomers} max={maxVal} color="bg-pink-500" />
                  <MetricBar label="Appointments" value={g.newAppointments} max={maxVal} color="bg-indigo-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-muted w-24 shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-subtle rounded overflow-hidden">
        <div className={`h-full ${color} rounded transition-all`} style={{ width: `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%` }} />
      </div>
      <span className="text-[12px] font-medium w-8 text-right">{value}</span>
    </div>
  );
}