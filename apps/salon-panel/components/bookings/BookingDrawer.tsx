'use client'

import { Booking, BookingStatus } from '@/lib/types'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { X } from 'lucide-react'

interface BookingDrawerProps {
  booking: Booking
  canManage: boolean
  onUpdateStatus: (id: string, status: BookingStatus) => void
  onClose: () => void
}

const DETAIL_ROWS = (b: Booking) => [
  ['Client',   b.customerName],
  ['Service',  b.serviceName],
  ['Stylist',  b.staffName],
  ['Date',     b.date],
  ['Time',     b.time],
  ['Duration', formatDuration(b.duration)],
  ['Price',    formatCurrency(b.price)],
]

export default function BookingDrawer({
  booking,
  canManage,
  onUpdateStatus,
  onClose,
}: BookingDrawerProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-end p-6"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">Booking Detail</h3>
          <button onClick={onClose} className="text-ash hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm">
          {DETAIL_ROWS(booking).map(([key, val]) => (
            <div key={key} className="flex justify-between">
              <span className="text-ash">{key}</span>
              <span className="font-medium">{val}</span>
            </div>
          ))}
          <div className="flex justify-between items-center">
            <span className="text-ash">Status</span>
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="mt-4 bg-smoke rounded-xl p-3">
            <p className="text-xs text-ash mb-1">Notes</p>
            <p className="text-sm">{booking.notes}</p>
          </div>
        )}

        {/* Actions */}
        {canManage && (
          <div className="mt-6 pt-5 border-t border-smoke flex gap-2">
            {booking.status === 'pending' && (
              <>
                <Button
                  className="flex-1"
                  onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                >
                  Confirm
                </Button>
                <Button
                  className="flex-1"
                  variant="danger"
                  onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                >
                  Cancel
                </Button>
              </>
            )}
            {booking.status === 'confirmed' && (
              <Button
                className="flex-1"
                variant="secondary"
                onClick={() => onUpdateStatus(booking.id, 'completed')}
              >
                Mark Completed
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}