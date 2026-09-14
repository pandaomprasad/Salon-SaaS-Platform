'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import {
  TrendingUp,
  CalendarDays,
  Users,
  Building2,
  AlertCircle,
  Clock,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

interface StatsData {
  totalSalons?: number
  activeSalons?: number
  deactivatedSalons?: number
  totalCustomers?: number
  totalBookings?: number
  completedBookings?: number
  cancelledBookings?: number
  todayBookings?: number
  totalRevenue?: number
  pendingOwnerRequests?: number
}

interface ActivityItem {
  id?: string
  _id?: string
  type: string
  title: string
  description: string
  timestamp: string
  salonName?: string
  amount?: number
}

export default function DashboardPage() {
  const [stats, setStats]         = useState<StatsData | null>(null)
  const [activity, setActivity]   = useState<ActivityItem[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadDashboard() {
      setLoading(true)
      try {
        const [statsRes, actRes] = await Promise.all([
          apiClient.get('/admin/stats'),
          apiClient.get('/admin/activity').catch(() => ({ data: { data: [] } })),
        ])

        if (!cancelled) {
          setStats(statsRes.data?.data || null)
          setActivity(actRes.data?.data || [])
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Platform Overview</h2>
        <p className="text-sm text-slate-400 mt-0.5">{currentDate}</p>
      </div>

      {/* Pending Approval Alert */}
      {stats?.pendingOwnerRequests && stats.pendingOwnerRequests > 0 ? (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">
              {stats.pendingOwnerRequests} owner registration request{stats.pendingOwnerRequests > 1 ? 's' : ''}
            </span>{' '}
            pending approval on the platform. Check owner requests tab.
          </p>
        </div>
      ) : null}

      {/* KPI Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Loader2 size={24} className="animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-semibold">Loading platform metrics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Platform Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              change="+14% this month"
              positive={true}
              icon={<TrendingUp size={20} className="text-blue-600" />}
            />
            <StatCard
              title="Total Salons"
              value={formatNumber(stats?.totalSalons || 0)}
              subtitle={`${stats?.activeSalons || 0} active salons`}
              icon={<Building2 size={20} className="text-emerald-600" />}
            />
            <StatCard
              title="Total Bookings"
              value={formatNumber(stats?.totalBookings || 0)}
              subtitle={`${stats?.todayBookings || 0} today`}
              icon={<CalendarDays size={20} className="text-purple-600" />}
            />
            <StatCard
              title="Registered Customers"
              value={formatNumber(stats?.totalCustomers || 0)}
              change="+8% this week"
              positive={true}
              icon={<Users size={20} className="text-amber-600" />}
            />
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">Recent Platform Activity</h3>
              <span className="text-xs text-slate-400 font-medium">Real-time updates</span>
            </div>

            {activity.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent activity logged.</p>
            ) : (
              <div className="space-y-4">
                {activity.slice(0, 10).map((act, i) => (
                  <div key={act.id || act._id || i} className="flex items-start gap-3.5 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900">{act.title || act.type}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {act.timestamp ? formatDate(act.timestamp) : 'Just now'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
