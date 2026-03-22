'use client'

import { useState } from 'react'
import { SERVICES } from '@/lib/data'
import { Service, ServiceCategory, User } from '@/lib/types'
import { formatCurrency, formatDuration, getCategoryStyle } from '@/lib/utils'
import { CategoryBadge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { Search, Clock, Tag } from 'lucide-react'

const CATEGORY_OPTIONS = [
  { value: 'all',       label: 'All Categories' },
  { value: 'Hair',      label: 'Hair'            },
  { value: 'Color',     label: 'Color'           },
  { value: 'Treatment', label: 'Treatment'       },
  { value: 'Skin',      label: 'Skin'            },
  { value: 'Nails',     label: 'Nails'           },
  { value: 'Special',   label: 'Special'         },
]

interface ServicesPageProps {
  user: User
}

export default function ServicesPage({ user }: ServicesPageProps) {
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('all')

  const filtered = SERVICES.filter(s => {
    const matchSearch   = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.description.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'all' || s.category === category
    return matchSearch && matchCategory
  })

  // Group by category
  const grouped = filtered.reduce<Record<string, Service[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  const totalRevenuePotential = filtered.reduce((sum, s) => sum + s.price, 0)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-display">Services & Pricing</h2>
          <p className="text-sm text-ash mt-1">
            {filtered.length} services · avg {formatCurrency(Math.round(totalRevenuePotential / filtered.length))} per service
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60">
          <Input
            placeholder="Search services..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
        <div className="w-44">
          <Select
            value={category}
            onChange={e => setCategory(e.target.value)}
            options={CATEGORY_OPTIONS}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Services', value: SERVICES.length },
          { label: 'Categories',     value: 6               },
          { label: 'Most Expensive', value: formatCurrency(Math.max(...SERVICES.map(s => s.price)))  },
          { label: 'Quickest',       value: formatDuration(Math.min(...SERVICES.map(s => s.duration))) },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-smoke rounded-2xl p-4">
            <p className="text-xs text-ash uppercase tracking-wide mb-2">{stat.label}</p>
            <p className="text-2xl font-display">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Grouped service list */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-ash text-sm text-center py-12">No services found.</p>
      ) : (
        Object.entries(grouped).map(([cat, services]) => (
          <div key={cat}>

            {/* Category heading */}
            <div className="flex items-center gap-3 mb-3">
              <CategoryBadge category={cat as ServiceCategory} />
              <span className="text-xs text-ash">{services.length} service{services.length > 1 ? 's' : ''}</span>
            </div>

            {/* Service cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {services.map(s => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>

          </div>
        ))
      )}

    </div>
  )
}

// ── Service Card ──────────────────────────────────────────────

function ServiceCard({ service: s }: { service: Service }) {
  return (
    <Card className="p-5">

      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-sm leading-snug">{s.name}</h3>
        <CategoryBadge category={s.category} />
      </div>

      {/* Description */}
      <p className="text-xs text-ash mb-4 leading-relaxed">{s.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-smoke">
        <div className="flex items-center gap-1.5 text-xs text-ash">
          <Clock size={12} />
          <span>{formatDuration(s.duration)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Tag size={12} className="text-ash" />
          <span className="text-sm font-semibold">{formatCurrency(s.price)}</span>
        </div>
      </div>

    </Card>
  )
}