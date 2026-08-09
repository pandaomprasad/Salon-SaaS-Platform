// ─── Roles ────────────────────────────────────────────────────

export type Role = "owner" | "manager" | "staff";

export type Page =
  | "dashboard"
  | "bookings"
  | "customers"
  | "services"
  | "schedule"
  | "reports"
  | "notifications"
  | "branches"
  | "staff"
  | "leaves";

// ─── Users ────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  initials: string;
  salonId?: string;
  branchId?: string;
  salon?: {
    name: string;
  };
}

// ─── Customers ────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  visits: number;
  totalSpent: number;
  lastVisit: string;
  notes: string;
}

// ─── Services ─────────────────────────────────────────────────

export type ServiceCategory =
  | "Hair"
  | "Color"
  | "Treatment"
  | "Skin"
  | "Nails"
  | "Special";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  duration: number;
  price: number;
  description: string;
}

// ─── Staff ────────────────────────────────────────────────────

export interface WorkingHours {
  start: string;
  end: string;
}

export type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  specialties: string[];
  rating: number;
  bookingsToday: number;
  schedule: Record<WeekDay, WorkingHours | null>;
}

// ─── Bookings ─────────────────────────────────────────────────

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: BookingStatus;
  notes: string;
}

// ─── Notifications ────────────────────────────────────────────

export type NotificationType =
  | "booking"
  | "cancellation"
  | "reminder"
  | "review";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  time: string;
  read: boolean;
}