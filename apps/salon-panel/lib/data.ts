import {
  User,
  Customer,
  Service,
  StaffMember,
  Booking,
  Notification,
} from './types'

// ─── Users ────────────────────────────────────────────────────

export const USERS: User[] = [
  { id: 'u1', name: 'Aria Chen',     email: 'aria@luxesalon.com',  password: 'owner123',   role: 'owner',   initials: 'AC' },
  { id: 'u2', name: 'Marco Silva',   email: 'marco@luxesalon.com', password: 'manager123', role: 'manager', initials: 'MS' },
  { id: 'u3', name: 'Jade Williams', email: 'jade@luxesalon.com',  password: 'staff123',   role: 'staff',   initials: 'JW' },
]

// ─── Customers ────────────────────────────────────────────────

export const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Sophie Laurent', email: 'sophie@mail.com', phone: '+91 98765 43210', visits: 14, totalSpent: 28400, lastVisit: '2026-03-15', notes: 'Prefers organic products. Allergic to ammonia.' },
  { id: 'c2', name: 'Priya Mehta',    email: 'priya@mail.com',  phone: '+91 91234 56789', visits: 8,  totalSpent: 16200, lastVisit: '2026-03-18', notes: 'Regular for keratin treatments.' },
  { id: 'c3', name: 'Elena Rossi',    email: 'elena@mail.com',  phone: '+91 99887 76655', visits: 22, totalSpent: 51000, lastVisit: '2026-03-10', notes: 'VIP client. Always prefers Jade.' },
  { id: 'c4', name: 'Ananya Sharma',  email: 'ananya@mail.com', phone: '+91 87654 32109', visits: 5,  totalSpent: 9800,  lastVisit: '2026-02-28', notes: 'New to balayage.' },
  { id: 'c5', name: 'Chloe Martin',   email: 'chloe@mail.com',  phone: '+91 77665 54433', visits: 11, totalSpent: 22100, lastVisit: '2026-03-20', notes: 'Monthly blowout. Birthday: June 12.' },
  { id: 'c6', name: 'Riya Kapoor',    email: 'riya@mail.com',   phone: '+91 88776 65544', visits: 3,  totalSpent: 5400,  lastVisit: '2026-03-05', notes: '' },
]

// ─── Services ─────────────────────────────────────────────────

export const SERVICES: Service[] = [
  { id: 's1',  name: 'Haircut & Style',   category: 'Hair',      duration: 60,  price: 1800,  description: 'Precision cut with blow-dry finish' },
  { id: 's2',  name: 'Balayage',          category: 'Color',     duration: 180, price: 6500,  description: 'Hand-painted highlights for natural dimension' },
  { id: 's3',  name: 'Keratin Treatment', category: 'Treatment', duration: 150, price: 5200,  description: 'Smoothing treatment for frizz-free hair' },
  { id: 's4',  name: 'Classic Facial',    category: 'Skin',      duration: 60,  price: 2200,  description: 'Deep cleanse, exfoliate, and hydrate' },
  { id: 's5',  name: 'Blowout',           category: 'Hair',      duration: 45,  price: 1200,  description: 'Professional blowdry styling' },
  { id: 's6',  name: 'Root Touch-Up',     category: 'Color',     duration: 90,  price: 2800,  description: 'Color refresh for roots' },
  { id: 's7',  name: 'Hair Spa',          category: 'Treatment', duration: 90,  price: 3000,  description: 'Deep conditioning and scalp massage' },
  { id: 's8',  name: 'Manicure',          category: 'Nails',     duration: 45,  price: 900,   description: 'Classic manicure with polish' },
  { id: 's9',  name: 'Pedicure',          category: 'Nails',     duration: 60,  price: 1200,  description: 'Relaxing pedicure with scrub and polish' },
  { id: 's10', name: 'Bridal Package',    category: 'Special',   duration: 300, price: 18000, description: 'Complete bridal hair and makeup' },
]

// ─── Staff ────────────────────────────────────────────────────

export const STAFF: StaffMember[] = [
  {
    id: 'st1', name: 'Jade Williams', role: 'Senior Stylist', initials: 'JW',
    specialties: ['Balayage', 'Color', 'Bridal'], rating: 4.9, bookingsToday: 5,
    schedule: {
      Mon: { start: '09:00', end: '18:00' },
      Tue: { start: '09:00', end: '18:00' },
      Wed: null,
      Thu: { start: '09:00', end: '18:00' },
      Fri: { start: '09:00', end: '20:00' },
      Sat: { start: '10:00', end: '17:00' },
      Sun: null,
    },
  },
  {
    id: 'st2', name: 'Rohan Desai', role: 'Stylist', initials: 'RD',
    specialties: ['Haircut', 'Keratin', 'Hair Spa'], rating: 4.7, bookingsToday: 4,
    schedule: {
      Mon: { start: '10:00', end: '19:00' },
      Tue: null,
      Wed: { start: '10:00', end: '19:00' },
      Thu: { start: '10:00', end: '19:00' },
      Fri: { start: '10:00', end: '19:00' },
      Sat: { start: '09:00', end: '18:00' },
      Sun: { start: '11:00', end: '16:00' },
    },
  },
  {
    id: 'st3', name: 'Nina Pereira', role: 'Beauty Therapist', initials: 'NP',
    specialties: ['Facial', 'Manicure', 'Pedicure'], rating: 4.8, bookingsToday: 6,
    schedule: {
      Mon: { start: '09:00', end: '17:00' },
      Tue: { start: '09:00', end: '17:00' },
      Wed: { start: '09:00', end: '17:00' },
      Thu: null,
      Fri: { start: '09:00', end: '17:00' },
      Sat: { start: '10:00', end: '16:00' },
      Sun: null,
    },
  },
  {
    id: 'st4', name: 'Kai Tanaka', role: 'Junior Stylist', initials: 'KT',
    specialties: ['Blowout', 'Haircut'], rating: 4.5, bookingsToday: 3,
    schedule: {
      Mon: null,
      Tue: { start: '11:00', end: '20:00' },
      Wed: { start: '11:00', end: '20:00' },
      Thu: { start: '11:00', end: '20:00' },
      Fri: { start: '11:00', end: '20:00' },
      Sat: { start: '10:00', end: '18:00' },
      Sun: { start: '10:00', end: '15:00' },
    },
  },
]

// ─── Bookings ─────────────────────────────────────────────────

export const BOOKINGS: Booking[] = [
  { id: 'b1', customerId: 'c1', customerName: 'Sophie Laurent', staffId: 'st1', staffName: 'Jade Williams', serviceId: 's2', serviceName: 'Balayage',          date: '2026-03-22', time: '10:00', duration: 180, price: 6500,  status: 'confirmed',  notes: 'Wants subtle highlights' },
  { id: 'b2', customerId: 'c5', customerName: 'Chloe Martin',   staffId: 'st1', staffName: 'Jade Williams', serviceId: 's5', serviceName: 'Blowout',            date: '2026-03-22', time: '14:00', duration: 45,  price: 1200,  status: 'confirmed',  notes: '' },
  { id: 'b3', customerId: 'c2', customerName: 'Priya Mehta',    staffId: 'st2', staffName: 'Rohan Desai',   serviceId: 's3', serviceName: 'Keratin Treatment',   date: '2026-03-22', time: '11:00', duration: 150, price: 5200,  status: 'confirmed',  notes: 'Second session' },
  { id: 'b4', customerId: 'c3', customerName: 'Elena Rossi',    staffId: 'st3', staffName: 'Nina Pereira',  serviceId: 's4', serviceName: 'Classic Facial',      date: '2026-03-22', time: '13:00', duration: 60,  price: 2200,  status: 'completed',  notes: '' },
  { id: 'b5', customerId: 'c4', customerName: 'Ananya Sharma',  staffId: 'st1', staffName: 'Jade Williams', serviceId: 's6', serviceName: 'Root Touch-Up',       date: '2026-03-23', time: '10:00', duration: 90,  price: 2800,  status: 'pending',    notes: 'First time coloring' },
  { id: 'b6', customerId: 'c6', customerName: 'Riya Kapoor',    staffId: 'st4', staffName: 'Kai Tanaka',    serviceId: 's1', serviceName: 'Haircut & Style',     date: '2026-03-23', time: '12:00', duration: 60,  price: 1800,  status: 'pending',    notes: '' },
  { id: 'b7', customerId: 'c3', customerName: 'Elena Rossi',    staffId: 'st2', staffName: 'Rohan Desai',   serviceId: 's7', serviceName: 'Hair Spa',            date: '2026-03-24', time: '15:00', duration: 90,  price: 3000,  status: 'confirmed',  notes: 'VIP — extra care' },
  { id: 'b8', customerId: 'c1', customerName: 'Sophie Laurent', staffId: 'st3', staffName: 'Nina Pereira',  serviceId: 's8', serviceName: 'Manicure',            date: '2026-03-22', time: '16:30', duration: 45,  price: 900,   status: 'cancelled',  notes: '' },
]

// ─── Notifications ────────────────────────────────────────────

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'booking',      message: 'New booking: Sophie Laurent — Balayage at 10:00',      time: '2 min ago',  read: false },
  { id: 'n2', type: 'cancellation', message: 'Cancelled: Sophie Laurent — Manicure at 16:30',        time: '15 min ago', read: false },
  { id: 'n3', type: 'reminder',     message: 'Reminder: Priya Mehta arrives in 30 minutes',          time: '30 min ago', read: false },
  { id: 'n4', type: 'booking',      message: 'New booking: Riya Kapoor — Haircut & Style on Mar 23', time: '1 hr ago',   read: true  },
  { id: 'n5', type: 'review',       message: 'Elena Rossi left a 5-star review for Nina Pereira',    time: '2 hr ago',   read: true  },
  { id: 'n6', type: 'reminder',     message: '3 bookings scheduled for tomorrow morning',             time: '3 hr ago',   read: true  },
]