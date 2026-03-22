'use client'

import { useState } from 'react'
import { STAFF, BOOKINGS } from '@/lib/data'
import { StaffMember, WeekDay, User } from '@/lib/types'
import { StatusBadge } from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { Star, Clock, CalendarDays } from 'lucide-react'

const DAYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface SchedulePageProps {
  user: User
}

export default function SchedulePage({ user }: SchedulePageProps) {
  const [selected, setSelected] = useState<StaffMember | null>(null)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-display">Staff Schedule</h2>
        <p className="text-sm text-ash mt-1">{STAFF.length} staff members</p>
      </div>

      {/* Weekly grid */}
      <div className="bg-white border border-smoke rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-smoke bg-smoke/40">
                <th className="text-left text-xs font-medium text-ash px-5 py-3 w-48">
                  Staff Member
                </th>
                {DAYS.map(day => (
                  <th key={day} className="text-center text-xs font-medium text-ash px-3 py-3">
                    {day}
                  </th>
                ))}
                <th className="text-center text-xs font-medium text-ash px-3 py-3">
                  Today
                </th>
              </tr>
            </thead>
            <tbody>
              {STAFF.map(s => (
                <tr
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="border-b border-smoke/50 hover:bg-smoke/20 transition-colors cursor-pointer"
                >
                  {/* Staff info */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-smoke text-ink flex items-center justify-center text-xs font-semibold shrink-0">
                        {s.initials}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-[11px] text-ash">{s.role}</p>
                      </div>
                    </div>
                  </td>

                  {/* Day columns */}
                  {DAYS.map(day => {
                    const hours = s.schedule[day]
                    return (
                      <td key={day} className="px-3 py-4 text-center">
                        {hours ? (
                          <div>
                            <p className="text-xs font-medium text-ink">{hours.start}</p>
                            <p className="text-[10px] text-ash">– {hours.end}</p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-silver bg-smoke px-2 py-0.5 rounded-full">
                            Off
                          </span>
                        )}
                      </td>
                    )
                  })}

                  {/* Today's bookings count */}
                  <td className="px-3 py-4 text-center">
                    <span className="text-sm font-semibold text-ink">
                      {s.bookingsToday}
                    </span>
                    <p className="text-[10px] text-ash">bookings</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAFF.map(s => (
          <Card key={s.id} onClick={() => setSelected(s)} className="p-5">

            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-smoke flex items-center justify-center text-sm font-semibold shrink-0">
                {s.initials}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{s.name}</p>
                <p className="text-[11px] text-ash">{s.role}</p>
              </div>
            </div>

            {/* Specialties */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {s.specialties.map(sp => (
                <span
                  key={sp}
                  className="text-[10px] bg-smoke text-ash px-2 py-0.5 rounded-full"
                >
                  {sp}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-smoke">
              <div className="flex items-center gap-1">
                <Star size={11} className="text-gold fill-gold" />
                <span className="text-xs font-medium">{s.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-ash">
                <CalendarDays size={11} />
                <span>{s.bookingsToday} today</span>
              </div>
            </div>

          </Card>
        ))}
      </div>

      {/* Staff detail drawer */}
      {selected && (
        <StaffDrawer
          staff={selected}
          onClose={() => setSelected(null)}
        />
      )}

    </div>
  )
}

// ── Staff Drawer ──────────────────────────────────────────────

function StaffDrawer({
  staff: s,
  onClose,
}: {
  staff: StaffMember
  onClose: () => void
}) {
  const staffBookings = BOOKINGS
    .filter(b => b.staffId === s.id)
    .slice(0, 5)

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-end p-6"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-smoke flex items-center justify-center text-base font-semibold">
              {s.initials}
            </div>
            <div>
              <h3 className="font-semibold text-base">{s.name}</h3>
              <p className="text-xs text-ash">{s.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ash hover:text-ink transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-smoke rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={12} className="text-gold fill-gold" />
              <p className="text-lg font-display">{s.rating}</p>
            </div>
            <p className="text-[10px] text-ash">Rating</p>
          </div>
          <div className="bg-smoke rounded-xl p-3 text-center">
            <p className="text-lg font-display">{s.bookingsToday}</p>
            <p className="text-[10px] text-ash">Bookings Today</p>
          </div>
        </div>

        {/* Specialties */}
        <div className="mb-6">
          <p className="text-xs font-semibold mb-2">Specialties</p>
          <div className="flex flex-wrap gap-2">
            {s.specialties.map(sp => (
              <span
                key={sp}
                className="text-xs bg-smoke text-ash px-3 py-1 rounded-full"
              >
                {sp}
              </span>
            ))}
          </div>
        </div>

        {/* Weekly schedule */}
        <div className="mb-6">
          <p className="text-xs font-semibold mb-2">Weekly Schedule</p>
          <div className="space-y-1.5">
            {DAYS.map(day => {
              const hours = s.schedule[day]
              return (
                <div key={day} className="flex items-center justify-between text-sm">
                  <span className="text-ash w-10">{day}</span>
                  {hours ? (
                    <span className="text-xs font-medium">
                      {hours.start} – {hours.end}
                    </span>
                  ) : (
                    <span className="text-xs text-silver">Day off</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent bookings */}
        <div>
          <p className="text-xs font-semibold mb-2">Recent Bookings</p>
          {staffBookings.length === 0 ? (
            <p className="text-xs text-ash">No bookings found.</p>
          ) : (
            <div className="space-y-2">
              {staffBookings.map(b => (
                <div
                  key={b.id}
                  className="flex items-center justify-between bg-smoke/50 rounded-xl px-3 py-2.5"
                >
                  <div>
                    <p className="text-xs font-medium">{b.customerName}</p>
                    <p className="text-[10px] text-ash mt-0.5">
                      {b.date} · {b.serviceName}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}