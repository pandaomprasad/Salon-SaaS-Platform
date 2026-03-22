'use client'

import { useState } from 'react'
import { BOOKINGS } from '@/lib/data'
import { Booking, BookingStatus, User } from '@/lib/types'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Plus, Search } from 'lucide-react'
import BookingDrawer from '@/components/bookings/BookingDrawer'
import NewBookingModal from '@/components/bookings/NewBookingModal'

const STATUS_OPTIONS = [
  { value: 'all',       label: 'All Statuses' },
  { value: 'pending',   label: 'Pending'      },
  { value: 'confirmed', label: 'Confirmed'    },
  { value: 'completed', label: 'Completed'    },
  { value: 'cancelled', label: 'Cancelled'    },
]

interface BookingsPageProps {
  user: User
}

export default function BookingsPage({ user }: BookingsPageProps) {
  const [bookings, setBookings]       = useState<Booking[]>(BOOKINGS)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected]       = useState<Booking | null>(null)
  const [showModal, setShowModal]     = useState(false)

  const canManage = user.role === 'owner' || user.role === 'manager'

  // ── Filtering ───────────────────────────────────────────────
  const filtered = bookings.filter(b => {
    const matchSearch =
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceName.toLowerCase().includes(search.toLowerCase())  ||
      b.staffName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    return matchSearch && matchStatus
  })

  // ── Status update ────────────────────────────────────────────
  function updateStatus(id: string, status: BookingStatus) {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
  }

  // ── Add booking ──────────────────────────────────────────────
  function addBooking(booking: Booking) {
    setBookings(prev => [booking, ...prev])
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display">Bookings</h2>
          <p className="text-sm text-ash mt-1">{filtered.length} bookings found</p>
        </div>
        {canManage && (
          <Button icon={<Plus size={15} />} onClick={() => setShowModal(true)}>
            New Booking
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60">
          <Input
            placeholder="Search by client, service, staff..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
        <div className="w-44">
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-smoke rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-smoke bg-smoke/40">
                {['Client', 'Service', 'Stylist', 'Date', 'Time', 'Duration', 'Price', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-ash px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-ash py-12 text-sm">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filtered.map(b => (
                  <tr
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className="border-b border-smoke/50 hover:bg-smoke/20 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-medium">{b.customerName}</td>
                    <td className="px-5 py-3.5 text-ash">{b.serviceName}</td>
                    <td className="px-5 py-3.5 text-ash">{b.staffName}</td>
                    <td className="px-5 py-3.5 text-ash">{b.date}</td>
                    <td className="px-5 py-3.5 text-ash">{b.time}</td>
                    <td className="px-5 py-3.5 text-ash">{formatDuration(b.duration)}</td>
                    <td className="px-5 py-3.5 font-medium">{formatCurrency(b.price)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      {canManage && b.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <Button size="sm" onClick={() => updateStatus(b.id, 'confirmed')}>
                            Confirm
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => updateStatus(b.id, 'cancelled')}>
                            Cancel
                          </Button>
                        </div>
                      )}
                      {canManage && b.status === 'confirmed' && (
                        <Button size="sm" variant="secondary" onClick={() => updateStatus(b.id, 'completed')}>
                          Mark Done
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking detail drawer */}
      {selected && (
        <BookingDrawer
          booking={selected}
          canManage={canManage}
          onUpdateStatus={updateStatus}
          onClose={() => setSelected(null)}
        />
      )}

      {/* New booking modal */}
      {showModal && (
        <NewBookingModal
          onAdd={addBooking}
          onClose={() => setShowModal(false)}
        />
      )}

    </div>
  )
}