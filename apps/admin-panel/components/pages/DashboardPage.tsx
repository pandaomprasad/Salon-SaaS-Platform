'use client'

import { SALONS, BOOKINGS, CUSTOMERS, STAFF, PLANS } from '@/lib/data'
import { formatCurrency, formatNumber } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import { PlanBadge, SalonStatusBadge } from '@/components/ui/Badge'
import {
  TrendingUp, CalendarDays, Users,
  UserCog, AlertCircle, Building2,
} from 'lucide-react'

export default function DashboardPage() {

  // ── KPIs ──────────────────────────────────────────────────────
  const totalRevenue    = SALONS.reduce((sum, s) => sum + s.totalRevenue, 0)
  const totalBookings   = SALONS.reduce((sum, s) => sum + s.totalBookings, 0)
  const activeSalons    = SALONS.filter(s => s.status === 'active').length
  const suspendedSalons = SALONS.filter(s => s.status === 'suspended').length
  const totalMRR        = PLANS.reduce((sum, p) => sum + p.price * p.salonCount, 0)

  // ── Booking status ────────────────────────────────────────────
  const byStatus = {
    confirmed: BOOKINGS.filter(b => b.status === 'confirmed').length,
    completed: BOOKINGS.filter(b => b.status === 'completed').length,
    pending:   BOOKINGS.filter(b => b.status === 'pending').length,
    cancelled: BOOKINGS.filter(b => b.status === 'cancelled').length,
  }

  // ── Top salons ────────────────────────────────────────────────
  const topSalons = [...SALONS]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)

  // ── Plan breakdown ────────────────────────────────────────────
  const planData = [
    { label: 'Basic',      count: SALONS.filter(s => s.plan === 'basic').length,      color: 'bg-slate-400'  },
    { label: 'Pro',        count: SALONS.filter(s => s.plan === 'pro').length,        color: 'bg-blue-500'   },
    { label: 'Enterprise', count: SALONS.filter(s => s.plan === 'enterprise').length, color: 'bg-indigo-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Platform Overview</h2>
        <p className="text-sm text-slate-400 mt-0.5">Sunday, 22 March 2026</p>
      </div>

      {/* Suspended alert */}
      {suspendedSalons > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-3.5">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600">
            <span className="font-semibold">{suspendedSalons} salon{suspendedSalons > 1 ? 's' : ''}</span> currently suspended and requires attention.
          </p>
        </div>
      )}

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          sub="across all salons"
          icon={<TrendingUp size={15} />}
          trend="up"
          dark
        />
        <StatCard
          label="Monthly MRR"
          value={formatCurrency(totalMRR)}
          sub="subscription revenue"
          icon={<TrendingUp size={15} />}
        />
        <StatCard
          label="Total Bookings"
          value={formatNumber(totalBookings)}
          sub={`${activeSalons} active salons`}
          icon={<CalendarDays size={15} />}
        />
        <StatCard
          label="Total Customers"
          value={formatNumber(CUSTOMERS.length)}
          sub={`${STAFF.length} staff members`}
          icon={<Users size={15} />}
        />
      </div>

      {/* Three column row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Salon status */}
        <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Salon Status</h3>
          <div className="space-y-4">
            {[
              { label: 'Active',    value: SALONS.filter(s => s.status === 'active').length,    color: 'bg-emerald-500' },
              { label: 'Inactive',  value: SALONS.filter(s => s.status === 'inactive').length,  color: 'bg-slate-300'   },
              { label: 'Suspended', value: SALONS.filter(s => s.status === 'suspended').length, color: 'bg-red-400'     },
            ].map(item => {
              const pct = Math.round((item.value / SALONS.length) * 100)
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium text-slate-700">
                      {item.value}{' '}
                      <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Plan breakdown */}
        <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Subscription Plans</h3>
          <div className="space-y-4">
            {planData.map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium text-slate-700">{item.count} salons</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking status */}
        <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Bookings by Status</h3>
          <div className="space-y-4">
            {[
              { label: 'Confirmed', value: byStatus.confirmed, color: 'bg-blue-500'    },
              { label: 'Completed', value: byStatus.completed, color: 'bg-emerald-500' },
              { label: 'Pending',   value: byStatus.pending,   color: 'bg-amber-400'   },
              { label: 'Cancelled', value: byStatus.cancelled, color: 'bg-red-400'     },
            ].map(item => {
              const pct = Math.round((item.value / BOOKINGS.length) * 100)
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium text-slate-700">
                      {item.value}{' '}
                      <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Top salons + Recent bookings */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Top salons */}
        <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Top Performing Salons</h3>
          <div className="space-y-4">
            {topSalons.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-lg font-bold text-slate-200 w-5 shrink-0">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Building2 size={14} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{s.name}</p>
                  <p className="text-[11px] text-slate-400">{s.city} · {s.totalBookings} bookings</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-700">{formatCurrency(s.totalRevenue)}</p>
                  <div className="flex justify-end mt-0.5">
                    <PlanBadge plan={s.plan} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Recent Bookings</h3>
          <div className="space-y-4">
            {BOOKINGS.slice(0, 6).map(b => (
              <div key={b.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{b.customerName}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {b.salonName} · {b.serviceName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-slate-700">{formatCurrency(b.price)}</p>
                  <p className="text-[11px] text-slate-400">{b.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}