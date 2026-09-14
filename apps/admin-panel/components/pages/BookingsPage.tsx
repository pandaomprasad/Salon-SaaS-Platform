'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Input, Select } from '@/components/ui/Input'
import { Search, CalendarDays, Loader2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface BookingItem {
  _id: string
  customerId?: { name?: string; email?: string; phone?: string }
  salonId?: { name?: string }
  branchId?: { name?: string }
  staffId?: { name?: string }
  services?: { serviceId?: { name?: string; price?: number; durationMinutes?: number } }[]
  date?: string
  startTime?: string
  totalPrice?: number
  price?: number
  status?: string
  createdAt?: string
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
]

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('ALL')
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function fetchBookings() {
      setLoading(true)
      try {
        const { data } = await apiClient.get('/admin/bookings', {
          params: {
            status: status !== 'ALL' ? status : undefined,
            limit: 100,
          },
        })
        if (!cancelled) {
          setBookings(data.data || [])
          setTotalCount(data.pagination?.total || (data.data || []).length)
        }
      } catch (err) {
        console.error('Error fetching bookings:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchBookings()
    return () => {
      cancelled = true
    }
  }, [status])

  const filtered = bookings.filter((b) => {
    const custName = b.customerId?.name || ''
    const custEmail = b.customerId?.email || ''
    const custPhone = b.customerId?.phone || ''
    const salonName = b.salonId?.name || ''
    const idStr = b._id || ''

    const q = search.toLowerCase().trim()
    if (!q) return true

    return (
      custName.toLowerCase().includes(q) ||
      custEmail.toLowerCase().includes(q) ||
      custPhone.includes(q) ||
      salonName.toLowerCase().includes(q) ||
      idStr.toLowerCase().includes(q)
    )
  })

  const totalValue = filtered.reduce((sum, b) => sum + (b.totalPrice || b.price || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Platform Bookings</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {totalCount} total appointments · {formatCurrency(totalValue)} filtered value
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60">
          <Input
            placeholder="Search by customer, phone, salon or booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
        <div className="w-48">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Loader2 size={24} className="animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-semibold">Loading platform bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <CalendarDays size={28} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No bookings found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Salon & Branch</th>
                  <th className="py-3.5 px-4">Staff</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filtered.map((b) => {
                  const custName = b.customerId?.name || 'Customer'
                  const custPhone = b.customerId?.phone || ''
                  const salonName = b.salonId?.name || 'Salon'
                  const branchName = b.branchId?.name || 'Main'
                  const staffName = b.staffId?.name || 'Unassigned'
                  const priceVal = b.totalPrice || b.price || 0
                  const statusStr = (b.status || 'CONFIRMED').toUpperCase()

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        #{b._id.slice(-6)}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{custName}</p>
                        {custPhone && <p className="text-[11px] text-slate-400">{custPhone}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{salonName}</p>
                        <p className="text-[11px] text-slate-400">{branchName}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">{staffName}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-800">{b.date || 'Today'}</p>
                        <p className="text-[11px] text-slate-400">{b.startTime || '09:00 AM'}</p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(priceVal)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {statusStr === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold">
                            <CheckCircle2 size={11} /> Completed
                          </span>
                        ) : statusStr === 'CANCELLED' ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold">
                            <XCircle size={11} /> Cancelled
                          </span>
                        ) : statusStr === 'IN_PROGRESS' ? (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold">
                            <Clock size={11} /> In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold">
                            <Clock size={11} /> Confirmed
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}