'use client'

import { useState } from 'react'
import { NOTIFICATIONS } from '@/lib/data'
import { Notification, NotificationType } from '@/lib/types'
import { Bell, CalendarX, Clock, Star, Check, CheckCheck } from 'lucide-react'

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  booking:      { icon: Bell,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
  cancellation: { icon: CalendarX, color: 'text-red-500',     bg: 'bg-red-50'     },
  reminder:     { icon: Clock,     color: 'text-amber-600',   bg: 'bg-amber-50'   },
  review:       { icon: Star,      color: 'text-gold',        bg: 'bg-yellow-50'  },
}

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all',          label: 'All'          },
  { value: 'unread',       label: 'Unread'       },
  { value: 'booking',      label: 'Bookings'     },
  { value: 'cancellation', label: 'Cancellations'},
  { value: 'reminder',     label: 'Reminders'    },
  { value: 'review',       label: 'Reviews'      },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS)
  const [filter, setFilter]               = useState('all')

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = notifications.filter(n => {
    if (filter === 'all')    return true
    if (filter === 'unread') return !n.read
    return n.type === filter
  })

  // ── Mark one as read ─────────────────────────────────────────
  function markRead(id: string) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  // ── Mark all as read ─────────────────────────────────────────
  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display">Notifications</h2>
          <p className="text-sm text-ash mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-ash hover:text-ink transition-colors"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`
              px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all
              ${filter === opt.value
                ? 'bg-ink text-paper'
                : 'bg-white border border-smoke text-ash hover:border-ink hover:text-ink'
              }
            `}
          >
            {opt.label}
            {opt.value === 'unread' && unreadCount > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === 'unread' ? 'bg-white/20 text-paper' : 'bg-gold/20 text-ink'}`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-ash">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notifications found.</p>
          </div>
        ) : (
          filtered.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={markRead}
            />
          ))
        )}
      </div>

    </div>
  )
}

// ── Notification Item ─────────────────────────────────────────

function NotificationItem({
  notification: n,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
}) {
  const config = TYPE_CONFIG[n.type]
  const Icon   = config.icon

  return (
    <div
      className={`
        flex items-start gap-4 p-4 rounded-2xl border transition-all
        ${n.read
          ? 'bg-white border-smoke'
          : 'bg-white border-ink/10 shadow-sm'
        }
      `}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
        <Icon size={16} className={config.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${n.read ? 'text-ash' : 'text-ink font-medium'}`}>
          {n.message}
        </p>
        <p className="text-[11px] text-silver mt-1">{n.time}</p>
      </div>

      {/* Unread dot / mark read button */}
      <div className="shrink-0 flex items-center">
        {!n.read ? (
          <button
            onClick={() => onMarkRead(n.id)}
            className="flex items-center gap-1.5 text-[11px] text-ash hover:text-ink transition-colors group"
          >
            <span className="w-2 h-2 rounded-full bg-gold group-hover:bg-ink transition-colors" />
            <Check size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ) : (
          <span className="w-2 h-2 rounded-full bg-smoke" />
        )}
      </div>

    </div>
  )
}