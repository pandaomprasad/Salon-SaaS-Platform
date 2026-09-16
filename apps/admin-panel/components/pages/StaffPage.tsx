'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import { formatDate, getInitials } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Search, Loader2, UserCog, Mail, Phone, Building2, Calendar, X } from 'lucide-react'

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
  const [owners, setOwners]           = useState<StaffItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null)

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
      (s.phone || '').includes(q) ||
      roleName.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Platform Owners & Managers</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {filtered.length} active salon managers and owners across the platform — Click any row to view details
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60">
          <Input
            placeholder="Search by name, email, phone or role..."
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
                    <tr
                      key={s._id}
                      onClick={() => setSelectedStaff(s)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-[11px] group-hover:scale-105 transition-transform">
                            {getInitials(s.name || 'OW')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{s.name}</p>
                            <p className="text-[11px] text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize">
                          {roleName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 font-mono">
                        {s.phone ? (s.phone.trim().length <= 7 ? "•••••••" : "•••••••" + s.phone.trim().slice(7)) : "—"}
                      </td>
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

      {/* Staff & Manager Details Modal */}
      {selectedStaff && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedStaff(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 relative overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
                  {getInitials(selectedStaff.name || 'OW')}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedStaff.name}</h3>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-wider">
                    {typeof selectedStaff.role === 'object' ? selectedStaff.role?.name || 'Owner' : String(selectedStaff.role || 'Owner')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Account Status</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      selectedStaff.isActive !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {selectedStaff.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-200/60 text-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Email Address</span>
                      <span className="font-semibold text-slate-900">{selectedStaff.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Phone Number</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {selectedStaff.phone
                          ? selectedStaff.phone.trim().length <= 7
                            ? "•••••••"
                            : "•••••••" + selectedStaff.phone.trim().slice(7)
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {selectedStaff.salonId && (
                    <div className="flex items-center gap-2.5">
                      <Building2 size={14} className="text-indigo-600 shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Associated Salon</span>
                        <span className="font-bold text-slate-900">
                          {typeof selectedStaff.salonId === 'object' ? selectedStaff.salonId?.name : String(selectedStaff.salonId)}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedStaff.createdAt && (
                    <div className="flex items-center gap-2.5">
                      <Calendar size={14} className="text-indigo-600 shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Joined Date</span>
                        <span className="font-semibold text-slate-800">{formatDate(selectedStaff.createdAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}