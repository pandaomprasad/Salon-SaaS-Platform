import { BookingStatus, SalonStatus, SubscriptionPlan, AnnouncementPriority } from '@/lib/types'
import { getBookingStatusStyle, getSalonStatusStyle, getPlanStyle, getPriorityStyle } from '@/lib/utils'

interface BadgeProps {
  label: string
  className?: string
}

export function Badge({ label, className = '' }: BadgeProps) {
  return (
    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ${className}`}>
      {label}
    </span>
  )
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge label={status} className={getBookingStatusStyle(status)} />
}

export function SalonStatusBadge({ status }: { status: SalonStatus }) {
  return <Badge label={status} className={getSalonStatusStyle(status)} />
}

export function PlanBadge({ plan }: { plan: SubscriptionPlan }) {
  return <Badge label={plan} className={getPlanStyle(plan)} />
}

export function PriorityBadge({ priority }: { priority: AnnouncementPriority }) {
  return <Badge label={priority} className={getPriorityStyle(priority)} />
}