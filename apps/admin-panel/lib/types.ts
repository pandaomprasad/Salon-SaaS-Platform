// ─── Navigation ───────────────────────────────────────────────

export type Page =
  | 'dashboard'
  | 'salons'
  | 'bookings'
  | 'customers'
  | 'staff'
  | 'reports'
  | 'announcements'
  | 'admins'

// ─── Admin ────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  name: string
  email: string
  password: string
  initials: string
}

// ─── Salons ───────────────────────────────────────────────────

export type SalonStatus      = 'active' | 'inactive' | 'suspended'
export type SubscriptionPlan = 'basic' | 'pro' | 'enterprise'

export interface Salon {
  id: string
  name: string
  owner: string
  email: string
  phone: string
  city: string
  status: SalonStatus
  plan: SubscriptionPlan
  joinedDate: string
  totalBookings: number
  totalRevenue: number
  totalStaff: number
  totalCustomers: number
}

// ─── Bookings ─────────────────────────────────────────────────

export type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled'

export interface Booking {
  id: string
  salonId: string
  salonName: string
  customerName: string
  staffName: string
  serviceName: string
  date: string
  time: string
  duration: number
  price: number
  status: BookingStatus
}

// ─── Customers ────────────────────────────────────────────────

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  salonId: string
  salonName: string
  totalVisits: number
  totalSpent: number
  joinedDate: string
}

// ─── Staff ────────────────────────────────────────────────────

export interface StaffMember {
  id: string
  name: string
  role: string
  initials: string
  salonId: string
  salonName: string
  rating: number
  totalBookings: number
  joinedDate: string
}

// ─── Announcements ────────────────────────────────────────────

export type AnnouncementTarget   = 'all' | 'basic' | 'pro' | 'enterprise'
export type AnnouncementPriority = 'low' | 'medium' | 'high'

export interface Announcement {
  id: string
  title: string
  message: string
  target: AnnouncementTarget
  priority: AnnouncementPriority
  sentAt: string
  sentBy: string
}

// ─── Subscription ─────────────────────────────────────────────

export interface PlanDetails {
  name: SubscriptionPlan
  price: number
  features: string[]
  salonCount: number
}