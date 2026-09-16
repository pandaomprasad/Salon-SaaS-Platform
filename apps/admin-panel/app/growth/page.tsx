"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { Building2, Users, CalendarDays, RefreshCw, BarChart2 } from "lucide-react";

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
    } catch (err) {
      console.error("Failed to fetch growth stats", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGrowth();
  }, []);

  const totals = growth.reduce(
    (acc, g) => ({
      salons: acc.salons + g.newSalons,
      customers: acc.customers + g.newCustomers,
      appointments: acc.appointments + g.newAppointments,
    }),
    { salons: 0, customers: 0, appointments: 0 }
  );

  const maxSalons = Math.max(...growth.map((g) => g.newSalons), 1);
  const maxCustomers = Math.max(...growth.map((g) => g.newCustomers), 1);
  const maxAppointments = Math.max(...growth.map((g) => g.newAppointments), 1);

  return (
    <div className="space-y-3 animate-fade-in max-w-[1600px] mx-auto pb-2">
      {/* Sleek Compact KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 px-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Salons (6 Months)</p>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">{totals.salons}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 size={16} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 px-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Customers (6 Months)</p>
            <p className="text-base font-extrabold text-emerald-600 mt-0.5">{totals.customers}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Users size={16} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 px-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointments (6 Months)</p>
            <p className="text-base font-extrabold text-purple-600 mt-0.5">{totals.appointments}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <CalendarDays size={16} />
          </div>
        </div>
      </div>

      {/* Control Header Bar */}
      <div className="flex items-center justify-between bg-white p-2.5 px-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-indigo-600" />
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Monthly Breakdown</h2>
        </div>

        <button
          onClick={fetchGrowth}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={13} className={`text-indigo-600 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Monthly Breakdown Container with Height Containment */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center space-y-2 shadow-xs">
          <RefreshCw size={24} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs font-bold text-slate-600">Calculating platform growth analytics...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex-1 max-h-[calc(100vh-175px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {growth.map((g) => (
              <div
                key={g.month}
                className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-2.5 hover:border-indigo-200 hover:bg-white transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <span className="text-xs font-extrabold text-slate-900">{g.month}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    {g.newSalons + g.newCustomers + g.newAppointments} Total Activity
                  </span>
                </div>

                <div className="space-y-2">
                  <MetricBar label="Salons" value={g.newSalons} max={maxSalons} color="bg-indigo-600" />
                  <MetricBar label="Customers" value={g.newCustomers} max={maxCustomers} color="bg-emerald-500" />
                  <MetricBar label="Appointments" value={g.newAppointments} max={maxAppointments} color="bg-purple-600" />
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
  const percentage = Math.round((value / max) * 100) || 0;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="font-extrabold text-slate-900">{value}</span>
      </div>
      <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.max(percentage, value > 0 ? 6 : 0)}%` }}
        />
      </div>
    </div>
  );
}