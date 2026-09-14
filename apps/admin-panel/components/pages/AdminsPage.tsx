'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import { AdminUser } from '@/lib/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ShieldCheck, Plus, Trash2, Mail, Loader2, Phone, AlertCircle } from 'lucide-react'

export default function AdminsPage() {
  const [admins, setAdmins]       = useState<AdminUser[]>([])
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError]         = useState('')
  const [form, setForm]           = useState({ name: '', email: '', password: '', phone: '' })

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function fetchAdmins() {
    setLoading(true)
    try {
      const { data } = await apiClient.get('/admin/admins')
      setAdmins(data.data || [])
    } catch (err) {
      console.error('Error fetching admins:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  async function handleAdd() {
    if (!form.name || !form.email || !form.password) return
    setError('')
    setSubmitting(true)
    try {
      await apiClient.post('/admin/admins', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
      })
      setForm({ name: '', email: '', password: '', phone: '' })
      setShowModal(false)
      fetchAdmins()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create admin account.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Are you sure you want to delete this admin account?')) return
    try {
      await apiClient.delete(`/admin/admins/${id}`)
      fetchAdmins()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete admin')
    }
  }

  const isValid = form.name && form.email && form.password

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Users</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {admins.length} superadmins with platform access
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
          Add Admin
        </Button>
      </div>

      {/* Admin Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Loader2 size={24} className="animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-semibold">Loading superadmins...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {admins.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between group hover:border-slate-200 transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {a.initials || 'AD'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-slate-900 truncate">{a.name}</p>
                    <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{a.email}</p>
                  <span className="inline-block mt-1 bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    SuperAdmin
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleRemove(a.id)}
                className="text-slate-300 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors shrink-0"
                title="Remove Admin"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Admin Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Admin User">
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <Input
              placeholder="e.g. Rohan Mehta"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <Input
              type="email"
              placeholder="e.g. rohan@salonhq.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              icon={<Mail size={14} />}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <Input
              type="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone (Optional)</label>
            <Input
              placeholder="e.g. +91 9876543210"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              icon={<Phone size={14} />}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!isValid || submitting}>
              {submitting ? 'Creating...' : 'Create Admin'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}