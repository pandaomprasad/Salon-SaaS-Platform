'use client'

import { useEffect, useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { Page } from '@/lib/types'
import { getUnreadCount } from '@/api/services/notificationService'

const PAGE_TITLES: Record<Page, string> = {
  dashboard:     'Dashboard',
  bookings:      'Bookings',
  customers:     'Customers',
  services:      'Services & Pricing',
  schedule:      'Staff Schedule',
  reports:       'Reports & Analytics',
  notifications: 'Notifications',
  branches:      'Branches',
  staff:         'Staff',
  leaves:        'Leaves & Availability',
}

interface HeaderProps {
  currentPage: Page
  initials: string
  onNavigate: (page: Page) => void
  onMenuClick: () => void
}

export default function Header({
  currentPage, initials, onNavigate, onMenuClick,
}: HeaderProps) {
  const [unread, setUnread] = useState(0)
  const UNREAD_POLL_MS = 120000

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const count = await getUnreadCount()
        if (!cancelled) setUnread(count)
      } catch {
        // endpoint unavailable — badge stays 0
      }
    }
    poll()
    const timer = setInterval(poll, UNREAD_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return (
    <header className="h-14 bg-paper border-b border-smoke/60 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 backdrop-blur-sm">

      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-ash hover:text-ink transition-colors p-1"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>

        {/* Gold accent + page title */}
        <div className="flex items-center gap-3">
          <div className="w-px h-4 bg-gold hidden sm:block" />
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-ash">
            {PAGE_TITLES[currentPage]}
          </p>
        </div>
      </div>

      {/* Right side */}
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
