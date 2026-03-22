'use client'

import { useState } from 'react'
import { CUSTOMERS } from '@/lib/data'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { Input, Select } from '@/components/ui/Input'
import { Search } from 'lucide-react'

const SALON_OPTIONS = [
  { value: 'all', label: 'All Salons' },
  ...Array.from(new Set(CUSTOMERS.map(c => c.salonName)))
    .map(name => ({ value: name, label: name })),
]

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [salon, setSalon]   = useState('all')

  const filtered = CUSTOMERS.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase())  ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    const matchSalon = salon === 'all' || c.salonName === salon
    return matchSearch && matchSalon
  })

  const totalSpent = filtered.reduce((sum, c) => sum + c.totalSpent, 0)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Customers</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {filtered.length} customers · {formatCurrency(totalSpent)} total spent
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60">
          <Input
            placeholder="Search by name, email or phone..."
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Customer', 'Salon', 'Email', 'Phone', 'Visits', 'Total Spent', 'Avg / Visit', 'Joined'].map(h => (
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
                  <td colSpan={8} className="text-center text-slate-400 py-12 text-sm">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                          {getInitials(c.name)}
                        </div>
                        <span className="font-medium text-slate-700">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{c.salonName}</td>
                    <td className="px-5 py-3.5 text-slate-500">{c.email}</td>
                    <td className="px-5 py-3.5 text-slate-500">{c.phone}</td>
                    <td className="px-5 py-3.5 text-slate-500">{c.totalVisits}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatCurrency(Math.round(c.totalSpent / c.totalVisits))}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(c.joinedDate)}</td>
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