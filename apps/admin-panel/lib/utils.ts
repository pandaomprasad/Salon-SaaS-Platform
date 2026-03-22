import { BookingStatus, SalonStatus, SubscriptionPlan, AnnouncementPriority } from './types'

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function formatNumber(num: number): string {
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`
  if (num >= 1000)   return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function getSalonStatusStyle(status: SalonStatus): string {
  const map: Record<SalonStatus, string> = {
    active:    'bg-emerald-50 text-emerald-700',
    inactive:  'bg-slate-100 text-slate-500',
    suspended: 'bg-red-50 text-red-600',
  }
  return map[status]
}

export function getBookingStatusStyle(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    confirmed: 'bg-blue-50 text-blue-700',
    pending:   'bg-amber-50 text-amber-700',
    completed: 'bg-slate-100 text-slate-500',
    cancelled: 'bg-red-50 text-red-500',
  }
  return map[status]
}

export function getPlanStyle(plan: SubscriptionPlan): string {
  const map: Record<SubscriptionPlan, string> = {
    basic:      'bg-slate-100 text-slate-600',
    pro:        'bg-blue-50 text-blue-700',
    enterprise: 'bg-indigo-50 text-indigo-700',
  }
  return map[plan]
}

export function getPriorityStyle(priority: AnnouncementPriority): string {
  const map: Record<AnnouncementPriority, string> = {
    low:    'bg-slate-100 text-slate-500',
    medium: 'bg-amber-50 text-amber-700',
    high:   'bg-red-50 text-red-600',
  }
  return map[priority]
}