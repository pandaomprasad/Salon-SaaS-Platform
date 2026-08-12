import { BookingStatus, ServiceCategory, Role } from './types'

// ─── Currency ─────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return `₹${(amount / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

// ─── Date & Time ──────────────────────────────────────────────

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// ─── Customer ─────────────────────────────────────────────────

export function getCustomerTier(totalSpent: number): {
  label: string
  color: string
} {
  if (totalSpent >= 40000) return { label: 'VIP',     color: 'bg-gold/20 text-ink'       }
  if (totalSpent >= 20000) return { label: 'Gold',    color: 'bg-amber-50 text-amber-700' }
  return                          { label: 'Regular', color: 'bg-smoke text-ash'          }
}

export function getCustomerInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// ─── Booking Status ───────────────────────────────────────────

export function getStatusStyle(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700',
    pending:   'bg-amber-50 text-amber-700',
    completed: 'bg-smoke text-ash',
    cancelled: 'bg-red-50 text-red-500',
  }
  return map[status]
}

// ─── Service Category ─────────────────────────────────────────

export function getCategoryStyle(category: ServiceCategory): string {
  const map: Record<ServiceCategory, string> = {
    Hair:      'bg-blue-50 text-blue-700',
    Color:     'bg-purple-50 text-purple-700',
    Treatment: 'bg-green-50 text-green-700',
    Skin:      'bg-pink-50 text-pink-700',
    Nails:     'bg-rose-50 text-rose-700',
    Special:   'bg-gold/20 text-ink',
  }
  return map[category]
}

// ─── Role ─────────────────────────────────────────────────────

export function getRoleStyle(role: Role): string {
  const map: Record<Role, string> = {
    owner:   'bg-ink text-paper',
    manager: 'bg-gold text-ink',
    staff:   'bg-smoke text-ink',
  }
  return map[role]
}