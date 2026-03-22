'use client'

import {
  LayoutDashboard, Building2, CalendarDays,
  Users, UserCog, BarChart3, Megaphone,
  ShieldCheck, LogOut, Menu,
} from 'lucide-react'
import { Page } from '@/lib/types'

interface NavItem {
  page: Page
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { page: 'salons',        label: 'Salons',        icon: Building2       },
  { page: 'bookings',      label: 'Bookings',      icon: CalendarDays    },
  { page: 'customers',     label: 'Customers',     icon: Users           },
  { page: 'staff',         label: 'Staff',         icon: UserCog         },
  { page: 'reports',       label: 'Reports',       icon: BarChart3       },
  { page: 'announcements', label: 'Announcements', icon: Megaphone       },
  { page: 'admins',        label: 'Admin Users',   icon: ShieldCheck     },
]

interface SidebarProps {
  currentPage: Page
  name: string
  email: string
  initials: string
  isOpen: boolean
  onNavigate: (page: Page) => void
  onLogout: () => void
  onClose: () => void
}

export default function Sidebar({
  currentPage, name, email, initials,
  isOpen, onNavigate, onLogout, onClose,
}: SidebarProps) {

  function handleNavigate(page: Page) {
    onNavigate(page)
    onClose()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 bg-slate-900 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>

        {/* Brand */}
        <div className="px-6 pt-7 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={14} className="text-white" />
            </div>
            <p className="text-[11px] font-semibold tracking-[0.15em] text-slate-400 uppercase">
              Admin Panel
            </p>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight pl-9">
            Salon HQ
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ page, label, icon: Icon }) => {
            const active = currentPage === page
            return (
              <button
                key={page}
                onClick={() => handleNavigate(page)}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                  text-[12px] font-medium transition-all duration-150
                  ${active
                    ? 'bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}
              >
                <Icon size={15} strokeWidth={active ? 2 : 1.5} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-[11px] font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">{name}</p>
              <p className="text-[10px] text-slate-500 truncate">{email}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="text-slate-600 hover:text-slate-300 transition-colors shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

      </aside>
    </>
  )
}