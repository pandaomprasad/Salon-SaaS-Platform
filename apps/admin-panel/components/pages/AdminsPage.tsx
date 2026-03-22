'use client'

import { useState } from 'react'
import { ADMIN_USERS } from '@/lib/data'
import { AdminUser } from '@/lib/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ShieldCheck, Plus, Trash2, Mail } from 'lucide-react'

export default function AdminsPage() {
  const [admins, setAdmins]       = useState<AdminUser[]>(ADMIN_USERS)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleAdd() {
    if (!form.name || !form.email || !form.password) return
    const initials = form.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    const newAdmin: AdminUser = {
      id:       `a${Date.now()}`,
      name:     form.name,
      email:    form.email,
      password: form.password,
      initials,
    }
    setAdmins(prev => [...prev, newAdmin])
    setForm({ name: '', email: '', password: '' })
    setShowModal(false)
  }

  function handleRemove(id: string) {
    setAdmins(prev => prev.filter(a => a.id !== id))
  }

  const isValid = form.name && form.email && form.password

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Users</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {admins.length} admins with platform access
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
          Add Admin
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {admins.map(a => (
          <div
            key={a.id}
            className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                  {a.initials}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{a.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ShieldCheck size={11} className="text-blue-500" />
                    <span className="text-[10px] font-semibold text-blue-600">
                      Super Admin
                    </span>
                  </div>
                </div>
              </div>
              {admins.length > 1 && (
                <button
                  onClick={() => handleRemove(a.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Mail size={12} />
              <span className="truncate">{a.email}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title="Add Admin User"
          subtitle="Grant super admin access to a new user"
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Sara Iyer"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              placeholder="sara@salonhq.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Set a strong password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAdd}
              disabled={!isValid}
            >
              Add Admin
            </Button>
          </div>
        </Modal>
      )}

    </div>
  )
}