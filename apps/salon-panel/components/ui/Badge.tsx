import { BookingStatus, ServiceCategory, Role } from '@/lib/types'
import { getStatusStyle, getCategoryStyle, getRoleStyle } from '@/lib/utils'

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

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <Badge label={status} className={getStatusStyle(status)} />
}

export function CategoryBadge({ category }: { category: ServiceCategory }) {
  return <Badge label={category} className={getCategoryStyle(category)} />
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge label={role} className={getRoleStyle(role)} />
}