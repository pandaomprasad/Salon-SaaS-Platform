'use client'

import { Menu } from 'lucide-react'
import { Page } from '@/lib/types'

const PAGE_TITLES: Record<Page, { title: string; sub: string }> = {
  dashboard:     { title: 'Dashboard',       sub: 'Platform overview'           },
  salons:        { title: 'Salons',           sub: 'Manage all salon accounts'   },
  bookings:      { title: 'Bookings',         sub: 'All bookings across salons'  },
  customers:     { title: 'Customers',        sub: 'All customers across salons' },
  staff:         { title: 'Staff',            sub: 'All staff across salons'     },
  reports:       { title: 'Reports',          sub: 'Revenue & analytics'         },
  announcements: { title: 'Announcements',    sub: 'Send notices to salons'      },
  admins:        { title: 'Admin Users',      sub: 'Manage admin access'         },
}

interface HeaderProps {
  currentPage: Page
  initials: string
  onMenuClick: () => void
}

export default function Header({ currentPage, initials, onMenuClick }: HeaderProps) {
  const { title, sub } = PAGE_TITLES[currentPage]

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">

      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-800 leading-tight">{title}</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">{sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[11px] font-semibold">Super Admin</span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">
          {initials}
        </div>
      </div>

    </header>
  )
}