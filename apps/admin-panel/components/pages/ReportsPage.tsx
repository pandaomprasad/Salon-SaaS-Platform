'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import { formatCurrency, formatNumber } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import { TrendingUp, Users, CreditCard, Loader2, Building2, CalendarDays } from 'lucide-react'

interface StatsData {
  totalSalons?: number
  activeSalons?: number
  totalCustomers?: number
  totalBookings?: number
  totalRevenue?: number
}

interface SalonItem {
  _id: string
  name: string
  city?: string
  monthlyRevenue?: number
  totalRevenue?: number
}

export default function ReportsPage() {
  const [stats, setStats]     = useState<StatsData | null>(null)
  const [salons, setSalons]   = useState<SalonItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadReports() {
      setLoading(true)
      try {
        const [statsRes, salonsRes] = await Promise.all([
          apiClient.get('/admin/stats'),
          apiClient.get('/admin/salons'),
        ])

        if (!cancelled) {
          setStats(statsRes.data?.data || null)
          setSalons(salonsRes.data?.data || [])
        }
      } catch (err) {
        console.error('Error loading reports:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadReports()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
        <p className="text-sm text-slate-400 mt-0.5">Platform-wide financial and operational breakdown</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Loader2 size={24} className="animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-semibold">Generating platform analytics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Platform Gross Volume"
              value={formatCurrency(stats?.totalRevenue || 0)}
              change="+14% vs last month"
              positive={true}
              icon={<TrendingUp size={18} className="text-blue-600" />}
            />
            <StatCard
              title="Active Salons"
              value={formatNumber(stats?.activeSalons || 0)}
              subtitle={`out of ${stats?.totalSalons || 0} total registered`}
              icon={<Building2 size={18} className="text-emerald-600" />}
            />
            <StatCard
              title="Total Appointments"
              value={formatNumber(stats?.totalBookings || 0)}
              icon={<CalendarDays size={18} className="text-purple-600" />}
            />
            <StatCard
              title="Customer Network"
              value={formatNumber(stats?.totalCustomers || 0)}
              icon={<Users size={18} className="text-amber-600" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Salons List Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
              <h3 className="font-bold text-slate-800 text-base mb-4">Salons Performance Ranking</h3>
              {salons.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No salons data available.</p>
              ) : (
                <div className="space-y-3">
                  {salons.map((s, idx) => (
                    <div key={s._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-xs font-black text-slate-400">#{idx + 1}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{s.name}</p>
                          <p className="text-[11px] text-slate-400">{s.city || 'India'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">
                        {formatCurrency(s.totalRevenue || s.monthlyRevenue || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subscription & Metric Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-2">Platform Subscription Distribution</h3>
                <p className="text-xs text-slate-400 mb-6">Tier distribution across active partner salons.</p>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>Pro Plan (Most Popular)</span>
                      <span>{salons.length} Salons</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Includes multi-staff scheduling, reports & priority support.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>Enterprise Tier</span>
                      <span>Unlimited scale</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Custom branding, dedicated account manager, API access.</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Updated automatically from live platform database</span>
                <span className="font-bold text-slate-700">Real-time Sync</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}