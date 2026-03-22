'use client'

import { SALONS, BOOKINGS, CUSTOMERS, STAFF, PLANS } from '@/lib/data'
import { formatCurrency, formatNumber } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import { PlanBadge } from '@/components/ui/Badge'
import { TrendingUp, Users, CreditCard, Star } from 'lucide-react'

export default function ReportsPage() {

  // ── Totals ────────────────────────────────────────────────────
  const totalRevenue  = SALONS.reduce((sum, s) => sum + s.totalRevenue, 0)
  const totalMRR      = PLANS.reduce((sum, p) => sum + p.price * p.salonCount, 0)
  const avgRating     = (STAFF.reduce((sum, s) => sum + s.rating, 0) / STAFF.length).toFixed(1)

  // ── Revenue by salon ──────────────────────────────────────────
  const sortedSalons  = [...SALONS].sort((a, b) => b.totalRevenue - a.totalRevenue)
  const maxRevenue    = sortedSalons[0].totalRevenue

  // ── Revenue by city ───────────────────────────────────────────
  const revenueByCity = SALONS.reduce<Record<string, number>>((acc, s) => {
    acc[s.city] = (acc[s.city] || 0) + s.totalRevenue
    return acc
  }, {})
  const cityRevenue   = Object.entries(revenueByCity).sort((a, b) => b[1] - a[1])
  const maxCity       = cityRevenue[0][1]

  // ── Plan MRR ──────────────────────────────────────────────────
  const planMRR = PLANS.map(p => ({
    ...p,
    monthly: p.price * p.salonCount,
  }))

  // ── Top staff ─────────────────────────────────────────────────
  const topStaff = [...STAFF].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
        <p className="text-sm text-slate-400 mt-0.5">Platform-wide performance overview</p>
      </div>

      {/* KPIs */}
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
          icon={<CreditCard size={15} />}
        />
        <StatCard
          label="Total Customers"
          value={formatNumber(CUSTOMERS.length)}
          sub="across all salons"
          icon={<Users size={15} />}
        />
        <StatCard
          label="Avg Staff Rating"
          value={avgRating}
          sub={`across ${STAFF.length} staff`}
          icon={<Star size={15} />}
        />
      </div>

      {/* Revenue by salon + city */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* By salon */}
        <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Revenue by Salon</h3>
          <div className="space-y-3">
            {sortedSalons.map((s, i) => {
              const pct = Math.round((s.totalRevenue / maxRevenue) * 100)
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-300 font-bold w-4 shrink-0">{i + 1}</span>
                      <span className="text-slate-600 truncate">{s.name}</span>
                      <PlanBadge plan={s.plan} />
                    </div>
                    <span className="font-semibold text-slate-700 shrink-0 ml-2">
                      {formatCurrency(s.totalRevenue)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By city */}
        <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Revenue by City</h3>
          <div className="space-y-4">
            {cityRevenue.map(([city, revenue]) => {
              const pct   = Math.round((revenue / maxCity) * 100)
              const count = SALONS.filter(s => s.city === city).length
              return (
                <div key={city}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">{city}</span>
                      <span className="text-[11px] text-slate-400">
                        {count} salon{count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-700">{formatCurrency(revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Plan MRR + Top staff */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Plan MRR */}
        <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Subscription Breakdown</h3>
          <div className="space-y-3">
            {planMRR.map(p => (
              <div key={p.name} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                <PlanBadge plan={p.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 capitalize">{p.name} Plan</p>
                  <p className="text-[11px] text-slate-400">
                    {p.salonCount} salon{p.salonCount > 1 ? 's' : ''} · {formatCurrency(p.price)}/mo each
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-700">{formatCurrency(p.monthly)}</p>
                  <p className="text-[11px] text-slate-400">MRR</p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Total MRR</span>
              <span className="text-sm font-bold text-blue-600">{formatCurrency(totalMRR)}</span>
            </div>
          </div>
        </div>

        {/* Top staff */}
        <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-semibold text-slate-800 mb-5">Top Staff by Bookings</h3>
          <div className="space-y-4">
            {topStaff.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4">
                <span className="text-lg font-bold text-slate-200 w-5 shrink-0">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[11px] font-bold text-blue-600 shrink-0">
                  {s.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{s.name}</p>
                  <p className="text-[11px] text-slate-400">{s.salonName} · {s.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-700">{s.totalBookings}</p>
                  <div className="flex items-center gap-0.5 justify-end">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-[11px] text-slate-400">{s.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}