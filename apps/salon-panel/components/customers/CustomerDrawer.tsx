'use client'

import { Customer } from '@/lib/types'
import { BOOKINGS } from '@/lib/data'
import { getCustomerTier, getCustomerInitials, formatCurrency } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { X, Phone, Mail, Calendar } from 'lucide-react'

interface CustomerDrawerProps {
  customer: Customer
  onClose: () => void
}

export default function CustomerDrawer({ customer: c, onClose }: CustomerDrawerProps) {
  const tier             = getCustomerTier(c.totalSpent)
  const customerBookings = BOOKINGS
    .filter(b => b.customerId === c.id)
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
            <div className="w-12 h-12 rounded-xl bg-smoke flex items-center justify-center text-base font-semibold shrink-0">
              {getCustomerInitials(c.name)}
            </div>
            <div>
              <h3 className="font-semibold text-base">{c.name}</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tier.color}`}>
                {tier.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-ash hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            ['Visits',      c.visits],
            ['Total Spent', formatCurrency(c.totalSpent)],
            ['Avg / Visit', formatCurrency(Math.round(c.totalSpent / c.visits))],
          ].map(([label, value]) => (
            <div key={label} className="bg-smoke rounded-xl p-3 text-center">
              <p className="text-lg font-display">{value}</p>
              <p className="text-[10px] text-ash mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="space-y-2.5 mb-6 text-sm">
          <div className="flex items-center gap-2 text-ash">
            <Phone size={13} /><span>{c.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-ash">
            <Mail size={13} /><span>{c.email}</span>
          </div>
          <div className="flex items-center gap-2 text-ash">
            <Calendar size={13} /><span>Last visit: {c.lastVisit}</span>
          </div>
        </div>

        {/* Notes */}
        {c.notes && (
          <div className="bg-amber-50 rounded-xl p-3 mb-6">
            <p className="text-xs font-medium text-amber-800 mb-1">Notes</p>
            <p className="text-xs text-amber-700">{c.notes}</p>
          </div>
        )}

        {/* Booking history */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Recent Bookings</h4>
          {customerBookings.length === 0 ? (
            <p className="text-xs text-ash">No bookings yet.</p>
          ) : (
            <div className="space-y-2">
              {customerBookings.map(b => (
                <div
                  key={b.id}
                  className="flex items-center justify-between bg-smoke/50 rounded-xl px-3 py-2.5"
                >
                  <div>
                    <p className="text-xs font-medium">{b.serviceName}</p>
                    <p className="text-[10px] text-ash mt-0.5">
                      {b.date} · {b.staffName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{formatCurrency(b.price)}</p>
                    <div className="mt-0.5">
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}