'use client'

import { BOOKINGS, CUSTOMERS, SERVICES, STAFF } from '@/lib/data'
import { User } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import { TrendingUp, Users, Scissors, Star } from 'lucide-react'

interface ReportsPageProps {
  user: User
}

export default function ReportsPage({ user }: ReportsPageProps) {

  // ── Revenue calculations ─────────────────────────────────────
  const completedBookings  = BOOKINGS.filter(b => b.status === 'completed' || b.status === 'confirmed')
  const totalRevenue       = completedBookings.reduce((sum, b) => sum + b.price, 0)
  const avgRevenuePerVisit = Math.round(totalRevenue / completedBookings.length)

  // ── Bookings by status ────────────────────────────────────────
  const byStatus = {
    confirmed: BOOKINGS.filter(b => b.status === 'confirmed').length,
    completed: BOOKINGS.filter(b => b.status === 'completed').length,
    pending:   BOOKINGS.filter(b => b.status === 'pending').length,
    cancelled: BOOKINGS.filter(b => b.status === 'cancelled').length,
  }

  // ── Top services by bookings ──────────────────────────────────
  const serviceCount = BOOKINGS.reduce<Record<string, { name: string; count: number; revenue: number }>>((acc, b) => {
    if (!acc[b.serviceId]) acc[b.serviceId] = { name: b.serviceName, count: 0, revenue: 0 }
    acc[b.serviceId].count++
    acc[b.serviceId].revenue += b.price
    return acc
  }, {})

  const topServices = Object.values(serviceCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // ── Top staff by bookings ─────────────────────────────────────
  const staffCount = BOOKINGS.reduce<Record<string, { name: string; count: number; revenue: number }>>((acc, b) => {
    if (!acc[b.staffId]) acc[b.staffId] = { name: b.staffName, count: 0, revenue: 0 }
    acc[b.staffId].count++
    acc[b.staffId].revenue += b.price
    return acc
  }, {})

  const topStaff = Object.values(staffCount)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4)

  // ── Top customers by spend ────────────────────────────────────
  const topCustomers = [...CUSTOMERS]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5)

  // ── Revenue by category ───────────────────────────────────────
  const revenueByCategory = BOOKINGS.reduce<Record<string, number>>((acc, b) => {
    const service = SERVICES.find(s => s.id === b.serviceId)
    if (!service) return acc
    acc[service.category] = (acc[service.category] || 0) + b.price
    return acc
  }, {})

  const categoryRevenue = Object.entries(revenueByCategory)
    .sort((a, b) => b[1] - a[1])

  const maxCategoryRevenue = Math.max(...categoryRevenue.map(([, v]) => v))

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-display">Reports & Analytics</h2>
        <p className="text-sm text-ash mt-1">Overview of salon performance</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          sub={`${completedBookings.length} bookings`}
          icon={<TrendingUp size={16} />}
          dark
        />
        <StatCard
          label="Avg per Visit"
          value={formatCurrency(avgRevenuePerVisit)}
          sub="across all bookings"
          icon={<Scissors size={16} />}
        />
        <StatCard
          label="Total Customers"
          value={CUSTOMERS.length}
          sub={`${CUSTOMERS.filter(c => c.visits >= 10).length} loyal clients`}
          icon={<Users size={16} />}
        />
        <StatCard
          label="Top Rating"
          value={Math.max(...STAFF.map(s => s.rating))}
          sub="highest staff rating"
          icon={<Star size={16} />}
        />
      </div>

      {/* Booking status breakdown + Revenue by category */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Booking status breakdown */}
        <div className="bg-white border border-smoke rounded-2xl p-6">
          <h3 className="font-semibold mb-5">Bookings by Status</h3>
          <div className="space-y-4">
            {[
              { label: 'Confirmed', value: byStatus.confirmed, color: 'bg-emerald-400' },
              { label: 'Completed', value: byStatus.completed, color: 'bg-ink'         },
              { label: 'Pending',   value: byStatus.pending,   color: 'bg-amber-400'   },
              { label: 'Cancelled', value: byStatus.cancelled, color: 'bg-red-400'     },
            ].map(item => {
              const pct = Math.round((item.value / BOOKINGS.length) * 100)
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-ash">{item.label}</span>
                    <span className="font-medium">{item.value} <span className="text-ash font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-smoke rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Revenue by category */}
        <div className="bg-white border border-smoke rounded-2xl p-6">
          <h3 className="font-semibold mb-5">Revenue by Category</h3>
          <div className="space-y-4">
            {categoryRevenue.map(([cat, revenue]) => {
              const pct = Math.round((revenue / maxCategoryRevenue) * 100)
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-ash">{cat}</span>
                    <span className="font-medium">{formatCurrency(revenue)}</span>
                  </div>
                  <div className="h-2 bg-smoke rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Top services + Top staff */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Top services */}
        <div className="bg-white border border-smoke rounded-2xl p-6">
          <h3 className="font-semibold mb-5">Top Services</h3>
          <div className="space-y-3">
            {topServices.map((s, i) => (
              <div key={s.name} className="flex items-center gap-4">
                <span className="text-xl font-display text-silver w-6 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-[11px] text-ash">{s.count} bookings</p>
                </div>
                <span className="text-sm font-semibold shrink-0">
                  {formatCurrency(s.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top staff */}
        <div className="bg-white border border-smoke rounded-2xl p-6">
          <h3 className="font-semibold mb-5">Staff Performance</h3>
          <div className="space-y-3">
            {topStaff.map((s, i) => {
              const staffMember = STAFF.find(st => st.name === s.name)
              return (
                <div key={s.name} className="flex items-center gap-4">
                  <span className="text-xl font-display text-silver w-6 shrink-0">
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-smoke flex items-center justify-center text-xs font-semibold shrink-0">
                    {staffMember?.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-[11px] text-ash">{s.count} bookings</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatCurrency(s.revenue)}</p>
                    <div className="flex items-center gap-0.5 justify-end">
                      <Star size={10} className="text-gold fill-gold" />
                      <span className="text-[11px] text-ash">{staffMember?.rating}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Top customers */}
      <div className="bg-white border border-smoke rounded-2xl p-6">
        <h3 className="font-semibold mb-5">Top Customers by Spend</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-smoke">
                {['#', 'Customer', 'Total Spent', 'Visits', 'Avg / Visit', 'Last Visit'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-ash pb-3 pr-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, i) => (
                <tr key={c.id} className="border-b border-smoke/50">
                  <td className="py-3 pr-6 font-display text-lg text-silver">{i + 1}</td>
                  <td className="py-3 pr-6 font-medium">{c.name}</td>
                  <td className="py-3 pr-6 font-semibold">{formatCurrency(c.totalSpent)}</td>
                  <td className="py-3 pr-6 text-ash">{c.visits}</td>
                  <td className="py-3 pr-6 text-ash">
                    {formatCurrency(Math.round(c.totalSpent / c.visits))}
                  </td>
                  <td className="py-3 pr-6 text-ash">{c.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}