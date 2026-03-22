'use client'

import { BOOKINGS, STAFF } from '@/lib/data'
import { User, Booking } from '@/lib/types'
import StatCard from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { TrendingUp, CalendarDays, Users, Clock, Star } from 'lucide-react'

const TODAY = '2026-03-22'

interface DashboardPageProps {
  user: User
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const todayBookings = BOOKINGS.filter(b => b.date === TODAY)
  const confirmed = todayBookings.filter(b => b.status === 'confirmed').length
  const completed = todayBookings.filter(b => b.status === 'completed').length
  const pending = todayBookings.filter(b => b.status === 'pending').length
  const todayRevenue = todayBookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.price, 0)

  const upcomingBookings = BOOKINGS
    .filter(b => b.date >= TODAY && b.status !== 'cancelled')
    .slice(0, 6)

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
  ]

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Greeting */}
      <div className="mb-2">
        <p className="text-[11px] tracking-[0.15em] uppercase text-ash/70 mb-3">
          Sunday, 22 March 2026
        </p>
        <h2 className="font-display text-5xl font-light text-ink leading-tight">
          Good morning, {user.name.split(' ')[0]}.
        </h2>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(todayRevenue)}
          sub="+12% vs last week"
          icon={<TrendingUp size={16} />}
          dark
        />
        <StatCard
          label="Today's Bookings"
          value={todayBookings.length}
          sub={`${confirmed} confirmed · ${completed} done`}
          icon={<CalendarDays size={16} />}
        />
        <StatCard
          label="Active Staff"
          value={STAFF.length}
          sub="All checked in"
          icon={<Users size={16} />}
        />
        <StatCard
          label="Pending"
          value={pending}
          sub="Awaiting confirmation"
          icon={<Clock size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Today's timeline */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold">Today's Schedule</h3>
            <span className="text-xs text-ash">{TODAY}</span>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-72">
            {timeSlots.map(slot => {
              const slotBookings = todayBookings.filter(b => b.time === slot)
              return (
                <div key={slot} className="flex gap-3 items-start">
                  <span className="text-[11px] text-ash w-12 pt-1 shrink-0">
                    {slot}
                  </span>
                  <div className="flex-1 min-h-[28px] border-t border-smoke pt-1 flex flex-wrap gap-1.5">
                    {slotBookings.map(b => (
                      <span
                        key={b.id}
                        className={`
                          inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg
                          ${b.status === 'completed' ? 'bg-smoke text-ash line-through' :
                            b.status === 'cancelled' ? 'bg-red-50 text-red-400' :
                              b.status === 'confirmed' ? 'bg-ink text-paper' :
                                'bg-amber-50 text-amber-700'}
                        `}
                      >
                        <span className="font-medium">{b.customerName.split(' ')[0]}</span>
                        <span className="opacity-50">·</span>
                        <span>{b.serviceName}</span>
                        <span className="opacity-50">·</span>
                        <span>{b.staffName.split(' ')[0]}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Staff today */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-semibold mb-5">Staff Today</h3>
          <div className="space-y-4">
            {STAFF.map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-smoke text-ink flex items-center justify-center text-xs font-semibold shrink-0">
                  {s.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-[11px] text-ash">{s.bookingsToday} bookings today</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star size={11} className="text-gold fill-gold" />
                  <span className="text-xs font-medium">{s.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Upcoming bookings table */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6">
        <h3 className="font-semibold mb-5">Upcoming Bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-smoke">
                {['Client', 'Service', 'Stylist', 'Date', 'Time', 'Duration', 'Price', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-ash pb-3 pr-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcomingBookings.map(b => (
                <tr key={b.id} className="border-b border-smoke/50 hover:bg-smoke/20 transition-colors">
                  <td className="py-3 pr-6 font-medium">{b.customerName}</td>
                  <td className="py-3 pr-6 text-ash">{b.serviceName}</td>
                  <td className="py-3 pr-6 text-ash">{b.staffName}</td>
                  <td className="py-3 pr-6 text-ash">{b.date}</td>
                  <td className="py-3 pr-6 text-ash">{b.time}</td>
                  <td className="py-3 pr-6 text-ash">{formatDuration(b.duration)}</td>
                  <td className="py-3 pr-6 font-medium">{formatCurrency(b.price)}</td>
                  <td className="py-3 pr-6">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}