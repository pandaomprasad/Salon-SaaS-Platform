import {
  AdminUser, Salon, Booking, Customer,
  StaffMember, Announcement, PlanDetails,
} from './types'

// ─── Admin Users ──────────────────────────────────────────────

export const ADMIN_USERS: AdminUser[] = [
  { id: 'a1', name: 'Rohan Mehta', email: 'rohan@salonhq.com', password: 'admin123', initials: 'RM' },
  { id: 'a2', name: 'Sara Iyer',   email: 'sara@salonhq.com',  password: 'sara456',  initials: 'SI' },
  { id: 'a3', name: 'Dev Kapoor',  email: 'dev@salonhq.com',   password: 'dev789',   initials: 'DK' },
]

// ─── Plans ────────────────────────────────────────────────────

export const PLANS: PlanDetails[] = [
  { name: 'basic',      price: 1999,  salonCount: 8, features: ['Up to 3 staff', 'Booking management', 'Customer profiles', 'Email support'] },
  { name: 'pro',        price: 4999,  salonCount: 5, features: ['Up to 10 staff', 'All Basic features', 'Staff scheduling', 'Reports', 'Priority support'] },
  { name: 'enterprise', price: 9999,  salonCount: 2, features: ['Unlimited staff', 'All Pro features', 'Custom branding', 'API access', 'Dedicated support'] },
]

// ─── Salons ───────────────────────────────────────────────────

export const SALONS: Salon[] = [
  { id: 'sl1',  name: 'Luxe Salon',      owner: 'Aria Chen',    email: 'aria@luxesalon.com',      phone: '+91 98765 43210', city: 'Mumbai',    status: 'active',    plan: 'enterprise', joinedDate: '2024-01-15', totalBookings: 342, totalRevenue: 685000, totalStaff: 8, totalCustomers: 124 },
  { id: 'sl2',  name: 'Glow Studio',     owner: 'Neha Sharma',  email: 'neha@glowstudio.com',     phone: '+91 91234 56789', city: 'Delhi',     status: 'active',    plan: 'pro',        joinedDate: '2024-03-10', totalBookings: 218, totalRevenue: 412000, totalStaff: 5, totalCustomers: 89  },
  { id: 'sl3',  name: 'The Beauty Bar',  owner: 'Priya Nair',   email: 'priya@beautybar.com',     phone: '+91 99887 76655', city: 'Bangalore', status: 'active',    plan: 'pro',        joinedDate: '2024-04-22', totalBookings: 195, totalRevenue: 378000, totalStaff: 4, totalCustomers: 76  },
  { id: 'sl4',  name: 'Serene Spa',      owner: 'Kavya Reddy',  email: 'kavya@serenespa.com',     phone: '+91 87654 32109', city: 'Hyderabad', status: 'inactive',  plan: 'basic',      joinedDate: '2024-06-01', totalBookings: 87,  totalRevenue: 142000, totalStaff: 3, totalCustomers: 41  },
  { id: 'sl5',  name: 'Radiance Salon',  owner: 'Meera Joshi',  email: 'meera@radiance.com',      phone: '+91 77665 54433', city: 'Pune',      status: 'active',    plan: 'basic',      joinedDate: '2024-07-18', totalBookings: 134, totalRevenue: 198000, totalStaff: 3, totalCustomers: 58  },
  { id: 'sl6',  name: 'Bliss Beauty',    owner: 'Tanya Singh',  email: 'tanya@blissbeauty.com',   phone: '+91 88776 65544', city: 'Chennai',   status: 'active',    plan: 'basic',      joinedDate: '2024-08-05', totalBookings: 102, totalRevenue: 167000, totalStaff: 3, totalCustomers: 47  },
  { id: 'sl7',  name: 'Aura Wellness',   owner: 'Ritu Bansal',  email: 'ritu@aurawellness.com',   phone: '+91 99001 12233', city: 'Jaipur',    status: 'suspended', plan: 'basic',      joinedDate: '2024-05-12', totalBookings: 54,  totalRevenue: 89000,  totalStaff: 2, totalCustomers: 28  },
  { id: 'sl8',  name: 'Elite Cuts',      owner: 'Sameer Khan',  email: 'sameer@elitecuts.com',    phone: '+91 98123 45678', city: 'Kolkata',   status: 'active',    plan: 'basic',      joinedDate: '2024-09-20', totalBookings: 89,  totalRevenue: 134000, totalStaff: 2, totalCustomers: 38  },
  { id: 'sl9',  name: 'Velvet Touch',    owner: 'Ananya Das',   email: 'ananya@velvettouch.com',  phone: '+91 97654 32100', city: 'Mumbai',    status: 'active',    plan: 'pro',        joinedDate: '2024-02-28', totalBookings: 178, totalRevenue: 312000, totalStaff: 6, totalCustomers: 94  },
  { id: 'sl10', name: 'Charm & Chic',    owner: 'Pooja Verma',  email: 'pooja@charmchic.com',     phone: '+91 96543 21098', city: 'Ahmedabad', status: 'active',    plan: 'enterprise', joinedDate: '2024-01-30', totalBookings: 289, totalRevenue: 542000, totalStaff: 9, totalCustomers: 108 },
]

// ─── Bookings ─────────────────────────────────────────────────

export const BOOKINGS: Booking[] = [
  { id: 'b1',  salonId: 'sl1',  salonName: 'Luxe Salon',     customerName: 'Sophie Laurent', staffName: 'Jade Williams', serviceName: 'Balayage',         date: '2026-03-22', time: '10:00', duration: 180, price: 6500,  status: 'confirmed'  },
  { id: 'b2',  salonId: 'sl1',  salonName: 'Luxe Salon',     customerName: 'Priya Mehta',    staffName: 'Rohan Desai',   serviceName: 'Keratin Treatment', date: '2026-03-22', time: '11:00', duration: 150, price: 5200,  status: 'confirmed'  },
  { id: 'b3',  salonId: 'sl2',  salonName: 'Glow Studio',    customerName: 'Aisha Khan',     staffName: 'Riya Nair',     serviceName: 'Haircut & Style',   date: '2026-03-22', time: '09:00', duration: 60,  price: 1800,  status: 'completed'  },
  { id: 'b4',  salonId: 'sl2',  salonName: 'Glow Studio',    customerName: 'Divya Menon',    staffName: 'Sana Sheikh',   serviceName: 'Classic Facial',    date: '2026-03-22', time: '13:00', duration: 60,  price: 2200,  status: 'confirmed'  },
  { id: 'b5',  salonId: 'sl3',  salonName: 'The Beauty Bar', customerName: 'Ramya Iyer',     staffName: 'Kiran Rao',     serviceName: 'Blowout',           date: '2026-03-22', time: '14:00', duration: 45,  price: 1200,  status: 'pending'    },
  { id: 'b6',  salonId: 'sl3',  salonName: 'The Beauty Bar', customerName: 'Leela Varma',    staffName: 'Pooja Das',     serviceName: 'Root Touch-Up',     date: '2026-03-23', time: '10:00', duration: 90,  price: 2800,  status: 'pending'    },
  { id: 'b7',  salonId: 'sl5',  salonName: 'Radiance Salon', customerName: 'Sneha Patil',    staffName: 'Asha More',     serviceName: 'Hair Spa',          date: '2026-03-22', time: '11:00', duration: 90,  price: 3000,  status: 'confirmed'  },
  { id: 'b8',  salonId: 'sl6',  salonName: 'Bliss Beauty',   customerName: 'Tara Nair',      staffName: 'Maya Pillai',   serviceName: 'Manicure',          date: '2026-03-22', time: '15:00', duration: 45,  price: 900,   status: 'completed'  },
  { id: 'b9',  salonId: 'sl9',  salonName: 'Velvet Touch',   customerName: 'Riya Kapoor',    staffName: 'Neha Gupta',    serviceName: 'Bridal Package',    date: '2026-03-24', time: '09:00', duration: 300, price: 18000, status: 'confirmed'  },
  { id: 'b10', salonId: 'sl10', salonName: 'Charm & Chic',   customerName: 'Elena Rossi',    staffName: 'Priya Singh',   serviceName: 'Balayage',          date: '2026-03-22', time: '10:00', duration: 180, price: 6500,  status: 'confirmed'  },
  { id: 'b11', salonId: 'sl1',  salonName: 'Luxe Salon',     customerName: 'Chloe Martin',   staffName: 'Jade Williams', serviceName: 'Blowout',           date: '2026-03-22', time: '14:00', duration: 45,  price: 1200,  status: 'confirmed'  },
  { id: 'b12', salonId: 'sl4',  salonName: 'Serene Spa',     customerName: 'Ananya Sharma',  staffName: 'Deepa Roy',     serviceName: 'Classic Facial',    date: '2026-03-20', time: '11:00', duration: 60,  price: 2200,  status: 'cancelled'  },
]

// ─── Customers ────────────────────────────────────────────────

export const CUSTOMERS: Customer[] = [
  { id: 'c1',  name: 'Sophie Laurent', email: 'sophie@mail.com', phone: '+91 98765 43210', salonId: 'sl1',  salonName: 'Luxe Salon',     totalVisits: 14, totalSpent: 28400, joinedDate: '2024-03-10' },
  { id: 'c2',  name: 'Priya Mehta',    email: 'priya@mail.com',  phone: '+91 91234 56789', salonId: 'sl1',  salonName: 'Luxe Salon',     totalVisits: 8,  totalSpent: 16200, joinedDate: '2024-05-22' },
  { id: 'c3',  name: 'Aisha Khan',     email: 'aisha@mail.com',  phone: '+91 99887 76655', salonId: 'sl2',  salonName: 'Glow Studio',    totalVisits: 11, totalSpent: 19800, joinedDate: '2024-04-15' },
  { id: 'c4',  name: 'Divya Menon',    email: 'divya@mail.com',  phone: '+91 87654 32109', salonId: 'sl2',  salonName: 'Glow Studio',    totalVisits: 6,  totalSpent: 11400, joinedDate: '2024-06-01' },
  { id: 'c5',  name: 'Ramya Iyer',     email: 'ramya@mail.com',  phone: '+91 77665 54433', salonId: 'sl3',  salonName: 'The Beauty Bar', totalVisits: 9,  totalSpent: 15600, joinedDate: '2024-05-10' },
  { id: 'c6',  name: 'Sneha Patil',    email: 'sneha@mail.com',  phone: '+91 88776 65544', salonId: 'sl5',  salonName: 'Radiance Salon', totalVisits: 7,  totalSpent: 12800, joinedDate: '2024-07-20' },
  { id: 'c7',  name: 'Tara Nair',      email: 'tara@mail.com',   phone: '+91 99001 12233', salonId: 'sl6',  salonName: 'Bliss Beauty',   totalVisits: 5,  totalSpent: 8900,  joinedDate: '2024-08-12' },
  { id: 'c8',  name: 'Riya Kapoor',    email: 'riya@mail.com',   phone: '+91 98123 45678', salonId: 'sl9',  salonName: 'Velvet Touch',   totalVisits: 12, totalSpent: 24600, joinedDate: '2024-03-25' },
  { id: 'c9',  name: 'Elena Rossi',    email: 'elena@mail.com',  phone: '+91 97654 32100', salonId: 'sl10', salonName: 'Charm & Chic',   totalVisits: 18, totalSpent: 42000, joinedDate: '2024-02-14' },
  { id: 'c10', name: 'Chloe Martin',   email: 'chloe@mail.com',  phone: '+91 96543 21098', salonId: 'sl1',  salonName: 'Luxe Salon',     totalVisits: 11, totalSpent: 22100, joinedDate: '2024-04-08' },
]

// ─── Staff ────────────────────────────────────────────────────

export const STAFF: StaffMember[] = [
  { id: 'st1',  name: 'Jade Williams', role: 'Senior Stylist',   initials: 'JW', salonId: 'sl1',  salonName: 'Luxe Salon',     rating: 4.9, totalBookings: 124, joinedDate: '2024-01-15' },
  { id: 'st2',  name: 'Rohan Desai',   role: 'Stylist',          initials: 'RD', salonId: 'sl1',  salonName: 'Luxe Salon',     rating: 4.7, totalBookings: 98,  joinedDate: '2024-02-01' },
  { id: 'st3',  name: 'Nina Pereira',  role: 'Beauty Therapist', initials: 'NP', salonId: 'sl1',  salonName: 'Luxe Salon',     rating: 4.8, totalBookings: 112, joinedDate: '2024-01-20' },
  { id: 'st4',  name: 'Riya Nair',     role: 'Senior Stylist',   initials: 'RN', salonId: 'sl2',  salonName: 'Glow Studio',    rating: 4.6, totalBookings: 89,  joinedDate: '2024-03-10' },
  { id: 'st5',  name: 'Sana Sheikh',   role: 'Beauty Therapist', initials: 'SS', salonId: 'sl2',  salonName: 'Glow Studio',    rating: 4.5, totalBookings: 76,  joinedDate: '2024-03-15' },
  { id: 'st6',  name: 'Kiran Rao',     role: 'Stylist',          initials: 'KR', salonId: 'sl3',  salonName: 'The Beauty Bar', rating: 4.7, totalBookings: 94,  joinedDate: '2024-04-22' },
  { id: 'st7',  name: 'Asha More',     role: 'Junior Stylist',   initials: 'AM', salonId: 'sl5',  salonName: 'Radiance Salon', rating: 4.4, totalBookings: 67,  joinedDate: '2024-07-18' },
  { id: 'st8',  name: 'Maya Pillai',   role: 'Beauty Therapist', initials: 'MP', salonId: 'sl6',  salonName: 'Bliss Beauty',   rating: 4.6, totalBookings: 58,  joinedDate: '2024-08-05' },
  { id: 'st9',  name: 'Neha Gupta',    role: 'Senior Stylist',   initials: 'NG', salonId: 'sl9',  salonName: 'Velvet Touch',   rating: 4.8, totalBookings: 102, joinedDate: '2024-02-28' },
  { id: 'st10', name: 'Priya Singh',   role: 'Senior Stylist',   initials: 'PS', salonId: 'sl10', salonName: 'Charm & Chic',   rating: 4.9, totalBookings: 118, joinedDate: '2024-01-30' },
]

// ─── Announcements ────────────────────────────────────────────

export const ANNOUNCEMENTS: Announcement[] = [
  { id: 'an1', title: 'Scheduled Maintenance',       message: 'The platform will be down for maintenance on March 25 from 2:00 AM to 4:00 AM IST.', target: 'all',        priority: 'high',   sentAt: '2026-03-20', sentBy: 'Rohan Mehta' },
  { id: 'an2', title: 'New Feature: Online Booking', message: 'We have launched online booking for customers. Update your salon profile to enable it.', target: 'all',        priority: 'medium', sentAt: '2026-03-15', sentBy: 'Sara Iyer'   },
  { id: 'an3', title: 'Pro Plan Upgrade Offer',      message: 'Upgrade to Pro before March 31 and get 2 months free. Valid for Basic plan salons only.', target: 'basic',      priority: 'medium', sentAt: '2026-03-10', sentBy: 'Rohan Mehta' },
  { id: 'an4', title: 'Enterprise API Access',       message: 'Enterprise plan salons can now access our REST API. Check the documentation for details.', target: 'enterprise', priority: 'low',    sentAt: '2026-03-05', sentBy: 'Dev Kapoor'  },
  { id: 'an5', title: 'Holiday Hours Reminder',      message: 'Please update your salon working hours for the upcoming Holi holiday on March 25.',       target: 'all',        priority: 'low',    sentAt: '2026-03-01', sentBy: 'Sara Iyer'   },
]