'use client'

import { useState } from 'react'
import { CUSTOMERS } from '@/lib/data'
import { Customer, User } from '@/lib/types'
import { getCustomerTier, getCustomerInitials, formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { Search, Phone, Mail, Calendar, ChevronRight } from 'lucide-react'
import CustomerDrawer from '@/components/customers/CustomerDrawer'

interface CustomersPageProps {
  user: User
}

export default function CustomersPage({ user }: CustomersPageProps) {
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)

  const filtered = CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())  ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-display">Customers</h2>
        <p className="text-sm text-ash mt-1">{CUSTOMERS.length} clients on record</p>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name, email or phone..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        icon={<Search size={14} />}
      />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <p className="text-ash text-sm col-span-full py-12 text-center">
            No customers found.
          </p>
        ) : (
          filtered.map(c => (
            <CustomerCard
              key={c.id}
              customer={c}
              onClick={() => setSelected(c)}
            />
          ))
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <CustomerDrawer
          customer={selected}
          onClose={() => setSelected(null)}
        />
      )}

    </div>
  )
}

// ── Customer Card ─────────────────────────────────────────────

function CustomerCard({
  customer: c,
  onClick,
}: {
  customer: Customer
  onClick: () => void
}) {
  const tier = getCustomerTier(c.totalSpent)

  return (
    <Card onClick={onClick} className="p-5 group">

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-smoke flex items-center justify-center text-sm font-semibold text-ink shrink-0">
            {getCustomerInitials(c.name)}
          </div>
          <div>
            <p className="font-medium text-sm">{c.name}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tier.color}`}>
              {tier.label}
            </span>
          </div>
        </div>
        <ChevronRight
          size={16}
          className="text-silver group-hover:text-ash transition-colors mt-1"
        />
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-ash">
          <Phone size={11} />
          <span>{c.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ash">
          <Mail size={11} />
          <span className="truncate">{c.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ash">
          <Calendar size={11} />
          <span>Last visit: {c.lastVisit}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-smoke">
        <div className="text-center">
          <p className="text-lg font-display">{c.visits}</p>
          <p className="text-[10px] text-ash">visits</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-display">{formatCurrency(c.totalSpent)}</p>
          <p className="text-[10px] text-ash">total spent</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-display">
            {formatCurrency(Math.round(c.totalSpent / c.visits))}
          </p>
          <p className="text-[10px] text-ash">avg / visit</p>
        </div>
      </div>

    </Card>
  )
}