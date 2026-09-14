'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Search, Loader2, Users } from 'lucide-react'

interface CustomerItem {
  _id: string
  name: string
  email: string
  phone?: string
  totalBookings?: number
  totalSpent?: number
  lastBookingDate?: string
  createdAt?: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    let cancelled = false
    async function fetchCustomers() {
      setLoading(true)
      try {
        const { data } = await apiClient.get('/admin/customers')
        if (!cancelled) {
          setCustomers(data.data || [])
        }
      } catch (err) {
        console.error('Error fetching customers:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCustomers()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    )
  })

  const totalSpent = filtered.reduce((sum, c) => sum + (c.totalSpent || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Platform Customers</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {filtered.length} customers · {formatCurrency(totalSpent)} total spent
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60">
          <Input
            placeholder="Search customer by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Loader2 size={24} className="animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-semibold">Loading platform customers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Users size={28} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No customers found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Total Bookings</th>
                  <th className="py-3.5 px-4">Total Spent</th>
                  <th className="py-3.5 px-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-[11px]">
                          {getInitials(c.name || 'CU')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.name || 'Customer'}</p>
                          <p className="text-[11px] text-slate-400">{c.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{c.phone || '—'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.totalBookings || 0}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(c.totalSpent || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {c.createdAt ? formatDate(c.createdAt) : 'Recently'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}