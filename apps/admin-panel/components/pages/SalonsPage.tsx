'use client'

import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/api-client'
import {
  Search,
  Plus,
  Building2,
  Users,
  GitBranch,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle2,
  Mail,
  User,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
} from 'lucide-react'

import SalonDetailsView from '@/components/pages/SalonDetailsView'

interface SalonItem {
  _id: string
  name: string
  description?: string
  owner?: { _id: string; name: string; email: string; phone: string } | null
  contactEmail?: string
  contactPhone?: string
  isActive: boolean
  deactivatedByAdmin?: boolean
  branchCount?: number
  branchesCount?: number
  staffCount?: number
  createdAt: string
}

export default function SalonsPage() {
  const [salons, setSalons]           = useState<SalonItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [viewMode, setViewMode]       = useState<'table' | 'grid'>('table')
  const [selected, setSelected]       = useState<SalonItem | null>(null)
  const [showAdd, setShowAdd]         = useState(false)
  const [deactivateId, setDeactivateId] = useState<string | null>(null)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [togglingId, setTogglingId]   = useState<string | null>(null)

  // Platform Summary Metrics State
  const [summary, setSummary] = useState({
    totalSalons: 0,
    activeSalons: 0,
    inactiveSalons: 0,
    totalBranches: 0,
    totalStaff: 0,
  })

  // Server-Side Pagination State (10 items per page)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchSalons = useCallback(
    async (targetPage = page, targetSearch = search, targetStatus = statusFilter, targetLimit = limit) => {
      setLoading(true)
      try {
        const { data } = await apiClient.get('/admin/salons', {
          params: {
            page: targetPage,
            limit: targetLimit,
            search: targetSearch.trim() || undefined,
            status: targetStatus !== 'ALL' ? targetStatus : undefined,
          },
        })
        const list = data.data?.salons || data.data || []
        setSalons(Array.isArray(list) ? list : [])

        if (data.data?.summary) {
          setSummary(data.data.summary)
        }

        if (data.data?.pagination) {
          setTotalCount(data.data.pagination.total || 0)
          setTotalPages(data.data.pagination.totalPages || 1)
          setPage(data.data.pagination.page || targetPage)
        } else {
          setTotalCount(list.length)
          setTotalPages(Math.ceil(list.length / targetLimit) || 1)
        }
      } catch (err) {
        console.error('Error fetching salons:', err)
        setSalons([])
      } finally {
        setLoading(false)
      }
    },
    [page, search, statusFilter, limit]
  )

  useEffect(() => {
    fetchSalons(1, search, statusFilter, limit)
  }, [search, statusFilter, limit])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      fetchSalons(newPage, search, statusFilter, limit)
    }
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    fetchSalons(1, search, statusFilter, newLimit)
  }

  const handleRowClick = (s: SalonItem) => {
    setSelected(s)
  }

  async function handleToggleStatus(s: SalonItem) {
    const isCurrentlyActive = s.isActive !== false && !s.deactivatedByAdmin
    if (isCurrentlyActive) {
      setDeactivateId(s._id)
      setDeactivateReason('')
      return
    }

    setTogglingId(s._id)
    try {
      await apiClient.patch(`/admin/salons/${s._id}`, {
        isActive: true,
        deactivatedByAdmin: false,
        adminDeactivationReason: null,
      })
      fetchSalons()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to activate salon')
    } finally {
      setTogglingId(null)
    }
  }

  async function confirmDeactivate() {
    if (!deactivateId) return
    setTogglingId(deactivateId)
    try {
      await apiClient.delete(`/admin/salons/${deactivateId}`, {
        data: { reason: deactivateReason || 'Deactivated by platform superadmin' },
      })
      setDeactivateId(null)
      fetchSalons()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to deactivate salon')
    } finally {
      setTogglingId(null)
    }
  }

  if (selected) {
    return (
      <SalonDetailsView
        salonId={selected._id}
        onBack={() => {
          setSelected(null)
          fetchSalons()
        }}
      />
    )
  }

  return (
    <div className="space-y-3 animate-fade-in max-w-[1600px] mx-auto pb-2">
      {/* Sleek Compact KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Salons</p>
            <p className="text-base font-extrabold text-slate-900">{summary.totalSalons || totalCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Salons</p>
            <p className="text-base font-extrabold text-emerald-600">{summary.activeSalons || totalCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <GitBranch size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Branches</p>
            <p className="text-base font-extrabold text-slate-900">{summary.totalBranches || 0}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0">
            <Users size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</p>
            <p className="text-base font-extrabold text-slate-900">{summary.totalStaff || 0}</p>
          </div>
        </div>
      </div>

      {/* Unified Filter Toolbar: Search + Status Tabs + View Mode Toggle + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search salon name, owner, or email..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({summary.totalSalons || totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active ({summary.activeSalons || totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'INACTIVE' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Inactive ({summary.inactiveSalons || 0})
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>

          <button
            onClick={() => fetchSalons()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Refresh Salons"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-600' : 'text-indigo-600'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Salon</span>
          </button>
        </div>
      </div>

      {/* Main Content Display */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center shadow-xs space-y-2">
          <RefreshCw size={24} className="animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-bold text-slate-700">Loading salon network...</p>
        </div>
      ) : salons.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center shadow-xs space-y-2 max-w-md mx-auto">
          <Building2 size={28} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No salons found</p>
          <p className="text-xs text-slate-500">No salons match your search criteria or filter query.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex-1 max-h-[calc(100vh-215px)] overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200/80">
                <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-2">Salon Name & Email</th>
                  <th className="px-4 py-2">Owner Account</th>
                  <th className="px-4 py-2">Branches</th>
                  <th className="px-4 py-2">Staff</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salons.map((s) => {
                  const isActive = s.isActive !== false && !s.deactivatedByAdmin
                  const ownerName = typeof s.owner === 'object' ? s.owner?.name : '—'
                  const ownerEmail = typeof s.owner === 'object' ? s.owner?.email : ''
                  const branches = s.branchCount || s.branchesCount || 1
                  const staff = s.staffCount || 0

                  return (
                    <tr
                      key={s._id}
                      onClick={() => handleRowClick(s)}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-[11px] shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                              {s.name}
                            </p>
                            <p className="text-slate-400 text-[10px] flex items-center gap-1">
                              <Mail size={10} /> {s.contactEmail || 'No email'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <User size={11} className="text-slate-400" />
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{ownerName}</p>
                            {ownerEmail && <p className="text-[10px] text-slate-400">{ownerEmail}</p>}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/80 font-bold text-[10px]">
                          <GitBranch size={10} />
                          {branches} {branches === 1 ? 'Location' : 'Locations'}
                        </span>
                      </td>

                      <td className="px-4 py-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80 font-bold text-[10px]">
                          <Users size={10} />
                          {staff} Staff
                        </span>
                      </td>

                      <td className="px-4 py-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-4 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRowClick(s)}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            View Details
                          </button>

                          <button
                            onClick={() => handleToggleStatus(s)}
                            disabled={togglingId === s._id}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                              isActive
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {salons.map((s) => {
            const isActive = s.isActive !== false && !s.deactivatedByAdmin
            const ownerName = typeof s.owner === 'object' ? s.owner?.name : '—'
            const branches = s.branchCount || s.branchesCount || 1
            const staff = s.staffCount || 0

            return (
              <div
                key={s._id}
                onClick={() => handleRowClick(s)}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:border-indigo-200 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-base shadow-xs group-hover:scale-105 transition-transform">
                      {s.name.charAt(0).toUpperCase()}
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

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {s.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <User size={11} className="text-slate-400" /> Owner: <span className="font-bold text-slate-800">{ownerName}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 text-xs">
                    <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/80 font-bold text-[10px] flex items-center gap-1">
                      <GitBranch size={11} /> {branches} Locations
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80 font-bold text-[10px] flex items-center gap-1">
                      <Users size={11} /> {staff} Staff
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleRowClick(s)}
                    className="text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <span>View Details</span>
                    <ChevronRight size={13} />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(s)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Compact Pagination Controls Bar */}
      {!loading && salons.length > 0 && (
        <div className="px-4 py-1.5 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <p className="text-slate-500 font-medium text-[11px]">
              Showing <span className="font-bold text-slate-900">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{Math.min(page * limit, totalCount)}</span> of{' '}
              <span className="font-bold text-slate-900">{totalCount}</span> salons
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 border-l border-slate-200 pl-3">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 font-bold text-slate-800 text-[11px] focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value={6}>6</option>
                <option value={8}>8</option>
                <option value={10}>10</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-none">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  onClick={() => handlePageChange(pNum)}
                  className={`w-6 h-6 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    page === pNum
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Deactivation Modal */}
      {deactivateId && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setDeactivateId(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Deactivate Salon</h3>
                <p className="text-xs text-slate-500">Suspend salon panel & client bookings</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action will deactivate the salon and all associated branches. Salon staff will not be able to accept customer appointments.
            </p>

            <textarea
              placeholder="Reason for deactivation (shown to salon owner, optional)..."
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 resize-none bg-slate-50"
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeactivateId(null)}
                className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivate}
                disabled={togglingId === deactivateId}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
              >
                {togglingId === deactivateId ? 'Deactivating...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Salon Modal */}
      {showAdd && (
        <CreateSalonModal
          onSuccess={() => {
            setShowAdd(false)
            fetchSalons()
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}

function CreateSalonModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    salonName: '',
    description: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: '',
  })

  function setF(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
    setError('')
  }

  function validateStep(): boolean {
    if (!form.salonName.trim()) {
      setError('Salon name is required')
      return false
    }
    if (!form.ownerName.trim()) {
      setError('Owner name is required')
      return false
    }
    if (!form.ownerEmail.trim()) {
      setError('Owner email is required')
      return false
    }
    if (!form.ownerPassword || form.ownerPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    return true
  }

  async function handleSubmit() {
    if (!validateStep()) return
    setSaving(true)
    setError('')
    try {
      await apiClient.post('/admin/salons', {
        salonName: form.salonName.trim(),
        description: form.description.trim(),
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim().toLowerCase(),
        ownerPhone: form.ownerPhone.trim(),
        ownerPassword: form.ownerPassword,
      })
      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create salon account')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 relative overflow-hidden animate-scale-up">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Onboard New Salon</h3>
              <p className="text-xs text-slate-500">Create salon tenant & owner account</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div className="space-y-3">
            <p className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-600">
              1. Salon Business Information
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Salon Name *</label>
              <input
                type="text"
                value={form.salonName}
                onChange={(e) => setF('salonName', e.target.value)}
                placeholder="e.g. Royal Cut Luxury Salon & Spa"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setF('description', e.target.value)}
                placeholder="Brief summary of salon services and location..."
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-600">
              2. Owner Account Credentials
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Owner Name *</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setF('ownerName', e.target.value)}
                  placeholder="Full Name"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.ownerPhone}
                  onChange={(e) => setF('ownerPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Owner Email *</label>
              <input
                type="email"
                value={form.ownerEmail}
                onChange={(e) => setF('ownerEmail', e.target.value)}
                placeholder="owner@salon.com"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Initial Account Password *</label>
              <input
                type="password"
                value={form.ownerPassword}
                onChange={(e) => setF('ownerPassword', e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Creating Salon...' : 'Onboard Salon'}
          </button>
        </div>
      </div>
    </div>
  )
}