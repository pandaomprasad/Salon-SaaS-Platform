"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import {
  Building2, GitBranch, UserCog, Users, CalendarDays, CheckCircle, TrendingUp,
} from "lucide-react";

interface Stats {
  salons: { total: number; active: number };
  branches: { total: number };
  owners: { total: number };
  staff: { total: number };
  customers: { total: number };
  appointments: { total: number; completed: number };
}

interface GrowthItem {
  month: string;
  newSalons: number;
  newCustomers: number;
  newAppointments: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [growth, setGrowth] = useState<GrowthItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [s, g] = await Promise.all([
          apiClient.get("/admin/stats"),
          apiClient.get("/admin/growth"),
        ]);
        setStats(s.data.data);
        setGrowth(g.data.data?.growth || []);
      } catch { } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <div className="animate-pulse bg-border/50 rounded h-7 w-48" />
        <div className="animate-pulse bg-border/50 rounded h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-border rounded-xl p-4">
            <div className="animate-pulse bg-border/50 rounded-lg w-8 h-8 mb-3" />
            <div className="animate-pulse bg-border/50 rounded h-7 w-10 mb-1" />
            <div className="animate-pulse bg-border/50 rounded h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-xl p-6 h-72" />
    </div>
  );

  const maxAppts = Math.max(...growth.map((g) => g.newAppointments), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Platform Overview</h1>
        <p className="text-[13px] text-muted mt-1">Real-time metrics across all salons</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={<Building2 size={16} />} label="Salons" value={stats.salons.active} sub={`${stats.salons.total} total`} color="bg-blue-500" />
          <StatCard icon={<GitBranch size={16} />} label="Branches" value={stats.branches.total} color="bg-purple-500" />
          <StatCard icon={<UserCog size={16} />} label="Owners" value={stats.owners.total} color="bg-amber-500" />
          <StatCard icon={<Users size={16} />} label="Staff" value={stats.staff.total} color="bg-emerald-500" />
          <StatCard icon={<Users size={16} />} label="Customers" value={stats.customers.total} color="bg-pink-500" />
          <StatCard icon={<CalendarDays size={16} />} label="Appointments" value={stats.appointments.total} sub={`${stats.appointments.completed} completed`} color="bg-indigo-500" />
        </div>
      )}

      {/* Growth Chart */}
      <div className="bg-gradient-to-br from-white to-slate-50 border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-[15px] font-semibold mb-1">Platform Growth</h2>
            <p className="text-[12px] text-muted">Last 6 months trends</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Appointments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Salons</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span>Customers</span>
            </div>
          </div>
        </div>

        {growth.length === 0 ? (
          <p className="text-[13px] text-muted py-8 text-center">No growth data yet.</p>
        ) : (
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[10px] text-muted pointer-events-none">
              <span>{maxAppts}</span>
              <span>{Math.round(maxAppts * 0.75)}</span>
              <span>{Math.round(maxAppts * 0.5)}</span>
              <span>{Math.round(maxAppts * 0.25)}</span>
              <span>0</span>
            </div>
            
            {/* Chart area */}
            <div className="ml-10 flex items-end gap-1 h-44">
              {/* Grid lines */}
              <div className="absolute inset-0 left-8 right-0 flex flex-col justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border-t border-dashed border-border/50" />
                ))}
              </div>
              
              {growth.map((g, i) => (
                <div 
                  key={g.month} 
                  className="flex-1 flex flex-col items-center gap-1 relative group"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-ink text-white text-[10px] px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <div className="font-medium">{g.newAppointments} appointments</div>
                    <div className="text-white/70">{g.newSalons} salons • {g.newCustomers} customers</div>
                  </div>
                  
                  {/* Main bar */}
                  <div 
                    className="w-full max-w-8 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md animate-grow-up will-change-transform"
                    style={{ 
                      height: `${Math.max((g.newAppointments / maxAppts) * 100, 5)}%`,
                      animationDelay: `${i * 100}ms`
                    } as React.CSSProperties}
                  />
                  
                  {/* Side indicators */}
                  <div className="flex gap-0.5 absolute -top-1 w-full justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div 
                      className="w-1 h-1 bg-blue-500 rounded-full"
                      style={{ 
                        height: `${Math.min((g.newSalons / Math.max(...growth.map(x => x.newSalons), 1)) * 8, 6)}px`
                      } as React.CSSProperties}
                    />
                    <div 
                      className="w-1 h-1 bg-pink-500 rounded-full"
                      style={{ 
                        height: `${Math.min((g.newCustomers / Math.max(...growth.map(x => x.newCustomers), 1)) * 8, 6)}px`
                      } as React.CSSProperties}
                    />
                  </div>
                  <span className="text-[11px] text-muted font-medium mt-1">{g.month}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg ${color} text-white flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-ink">{value}</p>
      <p className="text-[11px] text-muted mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted">{sub}</p>}
    </div>
  );
}