'use client'

import { useState } from 'react'
import { ANNOUNCEMENTS } from '@/lib/data'
import { Announcement, AnnouncementPriority, AnnouncementTarget } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { PriorityBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Megaphone, Plus, Users, Calendar } from 'lucide-react'

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

const TARGET_STYLES: Record<AnnouncementTarget, string> = {
  all:        'bg-blue-50 text-blue-700',
  basic:      'bg-slate-100 text-slate-600',
  pro:        'bg-blue-50 text-blue-700',
  enterprise: 'bg-indigo-50 text-indigo-700',
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(ANNOUNCEMENTS)
  const [showModal, setShowModal]         = useState(false)
  const [form, setForm] = useState({
    title: '', message: '', target: 'all', priority: 'medium',
  })

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSend() {
    if (!form.title || !form.message) return
    const newAnn: Announcement = {
      id:       `an${Date.now()}`,
      title:    form.title,
      message:  form.message,
      target:   form.target   as AnnouncementTarget,
      priority: form.priority as AnnouncementPriority,
      sentAt:   new Date().toISOString().split('T')[0],
      sentBy:   'Rohan Mehta',
    }
    setAnnouncements(prev => [newAnn, ...prev])
    setForm({ title: '', message: '', target: 'all', priority: 'medium' })
    setShowModal(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Announcements</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {announcements.length} announcements sent
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
          New Announcement
        </Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {announcements.map(a => (
          <div
            key={a.id}
            className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Megaphone size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-800">{a.title}</h3>
                  <PriorityBadge priority={a.priority} />
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${TARGET_STYLES[a.target]}`}>
                    {a.target === 'all' ? 'All Salons' : `${a.target} plan`}
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{a.message}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Users size={11} />
                    <span>Sent by {a.sentBy}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar size={11} />
                    <span>{formatDate(a.sentAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title="New Announcement"
          subtitle="Send a notice to salons on the platform"
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="Announcement title"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
            <Textarea
              label="Message"
              placeholder="Write your announcement..."
              value={form.message}
              onChange={e => set('message', e.target.value)}
              rows={4}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Target"
                value={form.target}
                onChange={e => set('target', e.target.value)}
                options={TARGET_OPTIONS}
              />
              <Select
                label="Priority"
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
                options={PRIORITY_OPTIONS}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSend}
              disabled={!form.title || !form.message}
            >
              Send Announcement
            </Button>
          </div>
        </Modal>
      )}

    </div>
  )
}