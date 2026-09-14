'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import { formatDate, getInitials } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Search, Loader2, UserCog } from 'lucide-react'

interface StaffItem {
  _id: string
  name: string
  email: string
  phone?: string
  role?: { name?: string } | string
  salonId?: { name?: string } | string
  isActive?: boolean
  createdAt?: string
}

export default function StaffPage() {
  const [owners, setOwners]   = useState<StaffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    let cancelled = false
    async function fetchOwners() {
      setLoading(true)
      try {
        const { data } = await apiClient.get('/admin/owners')
        if (!cancelled) {
          setOwners(data.data || [])
        }
      } catch (err) {
        console.error('Error fetching platform staff & owners:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchOwners()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = owners.filter((s) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    const roleName = typeof s.role === 'object' ? s.role?.name || '' : String(s.role || '')
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      roleName.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Platform Owners & Managers</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {filtered.length} active salon managers and owners across the platform
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60">
          <Input
            placeholder="Search by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Loader2 size={24} className="animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-semibold">Loading platform staff...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <UserCog size={28} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No staff found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filtered.map((s) => {
                  const roleName = typeof s.role === 'object' ? s.role?.name || 'Owner' : String(s.role || 'Owner')
                  const isActive = s.isActive !== false

                  return (
                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-[11px]">
                            {getInitials(s.name || 'OW')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{s.name}</p>
                            <p className="text-[11px] text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize">
                          {roleName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">{s.phone || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {s.createdAt ? formatDate(s.createdAt) : 'Recently'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}