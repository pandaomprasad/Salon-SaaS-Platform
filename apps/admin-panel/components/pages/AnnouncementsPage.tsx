'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Megaphone, Plus, Users, Calendar, Loader2, Trash2, AlertCircle } from 'lucide-react'

interface BannerItem {
  _id: string
  title: string
  message: string
  target?: string
  priority?: string
  isActive?: boolean
  createdAt?: string
}

const TARGET_OPTIONS = [
  { value: 'all',        label: 'All Salons'      },
  { value: 'basic',      label: 'Basic Plan'      },
  { value: 'pro',        label: 'Pro Plan'        },
  { value: 'enterprise', label: 'Enterprise Plan' },
]

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low'    },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High'   },
]

export default function AnnouncementsPage() {
  const [banners, setBanners]       = useState<BannerItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal]   = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm]             = useState({
    title: '',
    message: '',
    target: 'all',
    priority: 'medium',
  })

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function fetchBanners() {
    setLoading(true)
    try {
      const { data } = await apiClient.get('/admin/banners')
      setBanners(data.data || [])
    } catch (err) {
      console.error('Error fetching announcements:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  async function handleSend() {
    if (!form.title || !form.message) return
    setError('')
    setSubmitting(true)
    try {
      await apiClient.post('/admin/banners', {
        title: form.title.trim(),
        message: form.message.trim(),
        target: form.target,
        priority: form.priority,
      })

      setForm({ title: '', message: '', target: 'all', priority: 'medium' })
      setShowModal(false)
      fetchBanners()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to post announcement.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    try {
      await apiClient.delete(`/admin/banners/${id}`)
      fetchBanners()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete announcement')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Platform Broadcasts</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {banners.length} broadcast banners & system announcements
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
          New Broadcast
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Loader2 size={24} className="animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-semibold">Loading announcements...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-2 bg-white rounded-2xl border border-slate-100">
          <Megaphone size={28} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-600">No active announcements</p>
          <p className="text-xs text-slate-400">Post a broadcast to notify salon partners across the platform.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((ann) => (
            <div
              key={ann._id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Megaphone size={16} className="text-blue-600 shrink-0" />
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{ann.title}</h3>
                  </div>
                  <button
                    onClick={() => handleDelete(ann._id)}
                    className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete Broadcast"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.message}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Calendar size={12} /> {ann.createdAt ? formatDate(ann.createdAt) : 'Recently'}
                </span>
                <span className="font-bold uppercase text-[10px] tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {ann.target || 'all'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Broadcast Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New System Broadcast">
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Broadcast Title</label>
            <Input
              placeholder="e.g. Scheduled System Maintenance"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
            <Select
              value={form.target}
              onChange={(e) => set('target', e.target.value)}
              options={TARGET_OPTIONS}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Message</label>
            <Textarea
              rows={4}
              placeholder="Type your message to salon partners..."
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={!form.title || !form.message || submitting}>
              {submitting ? 'Broadcasting...' : 'Send Broadcast'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}