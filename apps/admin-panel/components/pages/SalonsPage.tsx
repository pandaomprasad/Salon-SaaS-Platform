'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { SalonStatusBadge, PlanBadge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import {
  Search, Plus, Building2, MapPin,
  Phone, Mail, Users, CalendarDays,
  TrendingUp, X, Power, PowerOff, Loader2, AlertCircle,
} from 'lucide-react'

interface SalonItem {
  _id: string
  id?: string
  name: string
  owner?: { _id?: string; name?: string; email?: string; phone?: string } | string
  contactEmail?: string
  contactPhone?: string
  city?: string
  state?: string
  status?: string
  isActive?: boolean
  deactivatedByAdmin?: boolean
  plan?: string
  branchesCount?: number
  staffCount?: number
  monthlyRevenue?: number
  bookingsCount?: number
  createdAt?: string
}

const STATUS_OPTIONS = [
  { value: 'all',       label: 'All Statuses' },
  { value: 'active',    label: 'Active'       },
  { value: 'inactive',  label: 'Inactive'     },
]

export default function SalonsPage() {
  const [salons, setSalons]           = useState<SalonItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatus]     = useState('all')
  const [selected, setSelected]       = useState<SalonItem | null>(null)
  const [showAdd, setShowAdd]         = useState(false)
  const [error, setError]             = useState('')

  const [form, setForm] = useState({
    salonName: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: '',
    description: '',
  })

  function set(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function fetchSalons() {
    setLoading(true)
    try {
      const { data } = await apiClient.get('/admin/salons')
      setSalons(data.data || [])
    } catch (err) {
      console.error('Error fetching salons:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalons()
  }, [])

  async function toggleStatus(s: SalonItem) {
    const isCurrentlyActive = s.isActive !== false && !s.deactivatedByAdmin
    const nextActive = !isCurrentlyActive
    try {
      await apiClient.patch(`/admin/salons/${s._id}`, {
        isActive: nextActive,
        deactivatedByAdmin: !nextActive,
        adminDeactivationReason: !nextActive ? 'Deactivated by SuperAdmin' : null,
      })

      fetchSalons()
      if (selected && selected._id === s._id) {
        setSelected((prev) => prev ? { ...prev, isActive: nextActive, deactivatedByAdmin: !nextActive } : null)
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update salon status')
    }
  }

  async function handleAddSalon() {
    if (!form.salonName || !form.ownerName || !form.ownerEmail || !form.ownerPassword) {
      setError('Please fill in all required fields.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await apiClient.post('/admin/salons', {
        salonName: form.salonName.trim(),
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim().toLowerCase(),
        ownerPhone: form.ownerPhone.trim(),
        ownerPassword: form.ownerPassword,
        description: form.description.trim(),
      })

      setShowAdd(false)
      setForm({
        salonName: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        ownerPassword: '',
        description: '',
      })
      fetchSalons()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create salon.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = salons.filter((s) => {
    const sName = s.name || ''
    const ownerName = typeof s.owner === 'object' ? s.owner?.name || '' : String(s.owner || '')
    const city = s.city || ''

    const matchSearch =
      sName.toLowerCase().includes(search.toLowerCase()) ||
      ownerName.toLowerCase().includes(search.toLowerCase()) ||
      city.toLowerCase().includes(search.toLowerCase())

    const isActive = s.isActive !== false && !s.deactivatedByAdmin
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive)

    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Salons Network</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {salons.length} onboarded salons across the platform
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
          Add Salon
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="w-72">
            <Input
              placeholder="Search salon, owner or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Loader2 size={24} className="animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-semibold">Loading salons network...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Building2 size={28} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-600">No salons found</p>
          <p className="text-xs text-slate-400">Try clearing your filters or onboard a new salon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const ownerObj = typeof s.owner === 'object' ? s.owner : null
            const ownerName = ownerObj?.name || (typeof s.owner === 'string' ? s.owner : 'Salon Owner')
            const isActive = s.isActive !== false && !s.deactivatedByAdmin

            return (
              <div
                key={s._id}
                onClick={() => setSelected(s)}
                className={`
                  bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:border-slate-300
                  hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4
                  ${selected?._id === s._id ? 'ring-2 ring-blue-600' : ''}
                `}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {s.name ? s.name.slice(0, 2).toUpperCase() : 'SL'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{s.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {s.city || 'India'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-50">
                    <p className="font-medium">
                      Owner: <span className="font-bold text-slate-900">{ownerName}</span>
                    </p>
                    {s.contactEmail && (
                      <p className="text-slate-400 text-[11px] truncate">{s.contactEmail}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Joined {s.createdAt ? formatDate(s.createdAt) : 'Recently'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStatus(s)
                    }}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                      isActive
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <PowerOff size={12} /> Disable
                      </>
                    ) : (
                      <>
                        <Power size={12} /> Enable
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                    selected.isActive !== false && !selected.deactivatedByAdmin
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {selected.isActive !== false && !selected.deactivatedByAdmin ? 'Active' : 'Deactivated'}
                </span>
              </div>
              <p className="text-xs text-slate-600">ID: {selected._id}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Contact & Location</h4>
              <p className="text-sm text-slate-700">
                Email: {selected.contactEmail || (typeof selected.owner === 'object' ? selected.owner?.email : 'N/A')}
              </p>
              <p className="text-sm text-slate-700">
                Phone: {selected.contactPhone || (typeof selected.owner === 'object' ? selected.owner?.phone : 'N/A')}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <Button
                variant={selected.isActive !== false && !selected.deactivatedByAdmin ? 'danger' : 'primary'}
                onClick={() => toggleStatus(selected)}
              >
                {selected.isActive !== false && !selected.deactivatedByAdmin ? 'Deactivate Salon' : 'Activate Salon'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add salon modal */}
      {showAdd && (
        <Modal
          title="Onboard New Salon"
          subtitle="Create a new salon and assign owner credentials"
          onClose={() => setShowAdd(false)}
        >
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Salon Name *"
              placeholder="e.g. Ramesh Salon"
              value={form.salonName}
              onChange={(e) => set('salonName', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Owner Name *"
                placeholder="Full owner name"
                value={form.ownerName}
                onChange={(e) => set('ownerName', e.target.value)}
              />
              <Input
                label="Owner Phone"
                placeholder="+91 9876543210"
                value={form.ownerPhone}
                onChange={(e) => set('ownerPhone', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Owner Email *"
                type="email"
                placeholder="owner@salon.com"
                value={form.ownerEmail}
                onChange={(e) => set('ownerEmail', e.target.value)}
              />
              <Input
                label="Owner Password *"
                type="password"
                placeholder="Set owner password"
                value={form.ownerPassword}
                onChange={(e) => set('ownerPassword', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                placeholder="Short description of the salon..."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAdd(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleAddSalon} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Salon'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}