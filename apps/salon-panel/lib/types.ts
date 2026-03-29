// ─── Roles ────────────────────────────────────────────────────

export type Role = "owner" | "manager" | "staff";

export type Page =
  | "dashboard"
  | "bookings"
  | "customers"
  | "services"
  | "schedule"
  | "reports"
  | "notifications";

// ─── Users ────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  initials: string;
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
  lastVisit: string; // YYYY-MM-DD
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
  duration: number; // minutes
  price: number; // INR
  description: string;
}

// ─── Staff ────────────────────────────────────────────────────

export interface WorkingHours {
  start: string; // HH:MM
  end: string; // HH:MM
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
  schedule: Record<WeekDay, WorkingHours | null>; // null = day off
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
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  price: number; // INR
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
  time: string; // relative e.g. "2 min ago"
  read: boolean;
}
