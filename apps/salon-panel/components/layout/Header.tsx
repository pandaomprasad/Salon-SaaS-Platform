'use client'

import { Bell } from 'lucide-react'
import { Page } from '@/lib/types'
import { NOTIFICATIONS } from '@/lib/data'

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  bookings: 'Bookings',
  customers: 'Customers',
  services: 'Services & Pricing',
  schedule: 'Staff Schedule',
  reports: 'Reports & Analytics',
  notifications: 'Notifications',
}

interface HeaderProps {
  currentPage: Page
  initials: string
  onNavigate: (page: Page) => void
}

export default function Header({ currentPage, initials, onNavigate }: HeaderProps) {
  const unread = NOTIFICATIONS.filter(n => !n.read).length

  return (
    <header className="h-14 bg-paper border-b border-smoke/60 flex items-center justify-between px-8 sticky top-0 z-30 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-px h-4 bg-gold" />
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-ash">
          {PAGE_TITLES[currentPage]}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('notifications')}
          className="relative text-silver hover:text-ink transition-colors"
        >
          <Bell size={17} strokeWidth={1.5} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold text-ink text-[8px] font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
        <div className="w-7 h-7 rounded-lg bg-ink text-white flex items-center justify-center text-[10px] font-semibold">
          {initials}
        </div>
      </div>
    </header>
  )
}