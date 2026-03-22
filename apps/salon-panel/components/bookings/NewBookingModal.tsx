'use client'

import { useState } from 'react'
import { CUSTOMERS, STAFF, SERVICES } from '@/lib/data'
import { Booking } from '@/lib/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Select, Input, Textarea } from '@/components/ui/Input'

interface NewBookingModalProps {
  onAdd: (booking: Booking) => void
  onClose: () => void
}

export default function NewBookingModal({ onAdd, onClose }: NewBookingModalProps) {
  const [form, setForm] = useState({
    customerId: '',
    staffId:    '',
    serviceId:  '',
    date:       '',
    time:       '',
    notes:      '',
  })

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    const customer = CUSTOMERS.find(c => c.id === form.customerId)
    const staff    = STAFF.find(s => s.id === form.staffId)
    const service  = SERVICES.find(s => s.id === form.serviceId)

    if (!customer || !staff || !service || !form.date || !form.time) return

    const newBooking: Booking = {
      id:           `b${Date.now()}`,
      customerId:   customer.id,
      customerName: customer.name,
      staffId:      staff.id,
      staffName:    staff.name,
      serviceId:    service.id,
      serviceName:  service.name,
      date:         form.date,
      time:         form.time,
      duration:     service.duration,
      price:        service.price,
      status:       'pending',
      notes:        form.notes,
    }

    onAdd(newBooking)
    onClose()
  }

  const isValid = form.customerId && form.staffId && form.serviceId && form.date && form.time

  return (
    <Modal title="New Booking" onClose={onClose}>
      <div className="space-y-4">
        <Select
          label="Client"
          value={form.customerId}
          onChange={e => set('customerId', e.target.value)}
          options={[
            { value: '', label: 'Select a client' },
            ...CUSTOMERS.map(c => ({ value: c.id, label: c.name })),
          ]}
        />
        <Select
          label="Staff"
          value={form.staffId}
          onChange={e => set('staffId', e.target.value)}
          options={[
            { value: '', label: 'Select a staff member' },
            ...STAFF.map(s => ({ value: s.id, label: `${s.name} — ${s.role}` })),
          ]}
        />
        <Select
          label="Service"
          value={form.serviceId}
          onChange={e => set('serviceId', e.target.value)}
          options={[
            { value: '', label: 'Select a service' },
            ...SERVICES.map(s => ({ value: s.id, label: `${s.name} — ₹${s.price.toLocaleString('en-IN')} (${s.duration}min)` })),
          ]}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
          />
          <Input
            label="Time"
            type="time"
            value={form.time}
            onChange={e => set('time', e.target.value)}
          />
        </div>
        <Textarea
          label="Notes"
          placeholder="Any special requests..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={!isValid}>
          Create Booking
        </Button>
      </div>
    </Modal>
  )
}