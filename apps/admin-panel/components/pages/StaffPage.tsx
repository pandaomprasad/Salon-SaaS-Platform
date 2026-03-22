'use client'

import { useState } from 'react'
import { STAFF } from '@/lib/data'
import { formatDate } from '@/lib/utils'
import { Input, Select } from '@/components/ui/Input'
import { Search, Star } from 'lucide-react'

const SALON_OPTIONS = [
  { value: 'all', label: 'All Salons' },
  ...Array.from(new Set(STAFF.map(s => s.salonName)))
    .map(name => ({ value: name, label: name })),
]

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  ...Array.from(new Set(STAFF.map(s => s.role)))
    .map(role => ({ value: role, label: role })),
]

export default function StaffPage() {
  const [search, setSearch] = useState('')
  const [salon, setSalon]   = useState('all')
  const [role, setRole]     = useState('all')

  const filtered = STAFF.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchSalon  = salon === 'all' || s.salonName === salon
    const matchRole   = role  === 'all' || s.role      === role
    return matchSearch && matchSalon && matchRole
  })

  const avgRating = filtered.length
    ? (filtered.reduce((sum, s) => sum + s.rating, 0) / filtered.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Staff</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {filtered.length} staff members · avg rating {avgRating}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
        <div className="w-44">
          <Select
            value={salon}
            onChange={e => setSalon(e.target.value)}
            options={SALON_OPTIONS}
          />
        </div>
        <div className="w-44">
          <Select
            value={role}
            onChange={e => setRole(e.target.value)}
            options={ROLE_OPTIONS}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Staff Member', 'Salon', 'Role', 'Rating', 'Total Bookings', 'Joined'].map(h => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-5 py-3.5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-12 text-sm">
                    No staff found.
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[11px] font-bold text-blue-600 shrink-0">
                          {s.initials}
                        </div>
                        <span className="font-medium text-slate-700">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{s.salonName}</td>
                    <td className="px-5 py-3.5 text-slate-500">{s.role}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="font-medium text-slate-700">{s.rating}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{s.totalBookings}</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(s.joinedDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}