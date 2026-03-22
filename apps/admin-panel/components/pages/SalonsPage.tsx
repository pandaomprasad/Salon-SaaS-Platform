'use client'

import { useState } from 'react'
import { SALONS } from '@/lib/data'
import { Salon, SalonStatus } from '@/lib/types'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { SalonStatusBadge, PlanBadge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import {
  Search, Plus, Building2, MapPin,
  Phone, Mail, Users, CalendarDays,
  TrendingUp, X, Power, PowerOff,
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'all',       label: 'All Statuses' },
  { value: 'active',    label: 'Active'       },
  { value: 'inactive',  label: 'Inactive'     },
  { value: 'suspended', label: 'Suspended'    },
]

const PLAN_OPTIONS = [
  { value: 'all',        label: 'All Plans'  },
  { value: 'basic',      label: 'Basic'      },
  { value: 'pro',        label: 'Pro'        },
  { value: 'enterprise', label: 'Enterprise' },
]

export default function SalonsPage() {
  const [salons, setSalons]       = useState<Salon[]>(SALONS)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('all')
  const [planFilter, setPlan]     = useState('all')
  const [selected, setSelected]   = useState<Salon | null>(null)
  const [showAdd, setShowAdd]     = useState(false)

  // ── Filtering ─────────────────────────────────────────────────
  const filtered = salons.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase())  ||
      s.city.toLowerCase().includes(search.toLowerCase())  ||
      s.owner.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    const matchPlan   = planFilter   === 'all' || s.plan   === planFilter
    return matchSearch && matchStatus && matchPlan
  })

  // ── Toggle status ─────────────────────────────────────────────
  function toggleStatus(id: string) {
    setSalons(prev => prev.map(s => {
      if (s.id !== id) return s
      const next: SalonStatus = s.status === 'active' ? 'inactive' : 'active'
      return { ...s, status: next }
    }))
    setSelected(prev => {
      if (!prev || prev.id !== id) return prev
      const next: SalonStatus = prev.status === 'active' ? 'inactive' : 'active'
      return { ...prev, status: next }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Salons</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} of {salons.length} salons
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
          Add Salon
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60">
          <Input
            placeholder="Search by name, city or owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
        <div className="w-40">
          <Select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="w-40">
          <Select
            value={planFilter}
            onChange={e => setPlan(e.target.value)}
            options={PLAN_OPTIONS}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Salon', 'City', 'Owner', 'Plan', 'Status', 'Bookings', 'Revenue', 'Staff', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-5 py-3.5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-slate-400 py-12 text-sm">
                    No salons found.
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Building2 size={14} className="text-blue-600" />
                        </div>
                        <span className="font-medium text-slate-700">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{s.city}</td>
                    <td className="px-5 py-4 text-slate-500">{s.owner}</td>
                    <td className="px-5 py-4"><PlanBadge plan={s.plan} /></td>
                    <td className="px-5 py-4"><SalonStatusBadge status={s.status} /></td>
                    <td className="px-5 py-4 text-slate-500">{formatNumber(s.totalBookings)}</td>
                    <td className="px-5 py-4 font-medium text-slate-700">{formatCurrency(s.totalRevenue)}</td>
                    <td className="px-5 py-4 text-slate-500">{s.totalStaff}</td>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant={s.status === 'active' ? 'danger' : 'secondary'}
                        icon={s.status === 'active' ? <PowerOff size={12} /> : <Power size={12} />}
                        onClick={() => toggleStatus(s.id)}
                      >
                        {s.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salon detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-end p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{selected.name}</h3>
                  <p className="text-xs text-slate-400">{selected.city}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Badges */}
            <div className="flex gap-2 mb-6">
              <SalonStatusBadge status={selected.status} />
              <PlanBadge plan={selected.plan} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Total Revenue',   value: formatCurrency(selected.totalRevenue) },
                { label: 'Total Bookings',  value: selected.totalBookings               },
                { label: 'Total Customers', value: selected.totalCustomers              },
                { label: 'Staff Members',   value: selected.totalStaff                  },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-lg font-bold text-slate-700">{value}</p>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="space-y-2.5 mb-6">
              {[
                { icon: Users,        value: selected.owner                       },
                { icon: Mail,         value: selected.email                       },
                { icon: Phone,        value: selected.phone                       },
                { icon: MapPin,       value: selected.city                        },
                { icon: CalendarDays, value: `Joined ${formatDate(selected.joinedDate)}` },
              ].map(({ icon: Icon, value }) => (
                <div key={value} className="flex items-center gap-2.5 text-sm text-slate-500">
                  <Icon size={13} className="text-slate-400 shrink-0" />
                  <span>{value}</span>
                </div>
              ))}
            </div>

            {/* Action */}
            <div className="pt-5 border-t border-slate-100">
              <Button
                className="w-full"
                variant={selected.status === 'active' ? 'danger' : 'primary'}
                icon={selected.status === 'active' ? <PowerOff size={13} /> : <Power size={13} />}
                onClick={() => toggleStatus(selected.id)}
              >
                {selected.status === 'active' ? 'Disable Salon' : 'Enable Salon'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add salon modal */}
      {showAdd && (
        <Modal
          title="Add New Salon"
          subtitle="Onboard a new salon to the platform"
          onClose={() => setShowAdd(false)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Salon Name" placeholder="e.g. Luxe Salon" />
              <Input label="City"       placeholder="e.g. Mumbai"     />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Owner Name" placeholder="Full name"         />
              <Input label="Phone"      placeholder="+91 98765 43210"   />
            </div>
            <Input label="Email" type="email" placeholder="owner@salon.com" />
            <Select
              label="Subscription Plan"
              options={[
                { value: 'basic',      label: 'Basic — ₹1,999/mo'      },
                { value: 'pro',        label: 'Pro — ₹4,999/mo'        },
                { value: 'enterprise', label: 'Enterprise — ₹9,999/mo' },
              ]}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={() => setShowAdd(false)}>
              Add Salon
            </Button>
          </div>
        </Modal>
      )}

    </div>
  )
}