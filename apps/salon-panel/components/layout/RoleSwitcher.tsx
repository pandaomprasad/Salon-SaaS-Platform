'use client'

import { X, Check } from 'lucide-react'
import { User, Role } from '@/lib/types'
import { USERS } from '@/lib/data'
import { getRoleStyle } from '@/lib/utils'

const roleOf = (role: string): Role => role as Role

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner:   'Full access — reports, settings & everything',
  manager: 'Bookings, staff, customers & services',
  staff:   'Own bookings & customer profiles only',
}

interface RoleSwitcherProps {
  currentUser: User
  onSelect: (user: User) => void
  onClose: () => void
}

export default function RoleSwitcher({ currentUser, onSelect, onClose }: RoleSwitcherProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-smoke">
          <div>
            <h3 className="font-semibold text-base">Switch Role</h3>
            <p className="text-xs text-ash mt-0.5">Preview as a different user</p>
          </div>
          <button onClick={onClose} className="text-ash hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* User list */}
        <div className="p-3 space-y-1.5">
          {USERS.map(u => {
            const active = u.id === currentUser.id
            return (
              <button
                key={u.id}
                onClick={() => { onSelect(u); onClose() }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                  transition-all duration-150
                  ${active ? 'bg-ink text-paper' : 'hover:bg-smoke text-ink'}
                `}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${active ? 'bg-white/15 text-paper' : 'bg-smoke text-ink'}`}>
                  {u.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{u.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${active ? 'bg-white/20 text-paper' : getRoleStyle(roleOf(u.role))}`}>
                      {u.role}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${active ? 'text-silver' : 'text-ash'}`}>
                    {ROLE_DESCRIPTIONS[roleOf(u.role)]}
                  </p>
                </div>
                {active && <Check size={15} className="text-paper shrink-0" />}
              </button>
            )
          })}
        </div>

        <p className="text-[11px] text-ash text-center pb-5">
          Demo only — no real authentication
        </p>
      </div>
    </div>
  )
}