// ============================================================
// types/api.ts
// TypeScript types for all salon-api models, payloads & responses
// ============================================================

// ── Response wrappers ────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ── Auth ──────────────────────────────────

export type UserRole = "owner" | "manager" | "staff" | "customer";

export interface BackendUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  salonId?: string;
  branchId?: string;
  isActive: boolean;
  extraPermissions?: string[];
  deniedPermissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginResponse {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
  salon?: Salon;
}

// ── Salon ────────────────────────────────

export interface Salon {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  owner: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalonPayload {
  name: string;
  description?: string;
  logo?: string;
}

export interface UpdateSalonPayload {
  name?: string;
  description?: string;
  logo?: string;
}

// ── Branch ───────────────────────────────

export interface Branch {
  _id: string;
  name: string;
  salon: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  phone: string;
  email?: string;
  operatingHours: {
    open: string;
    close: string;
  };
  slotDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchPayload {
  name: string;
  address: { street: string; city: string; state: string; pincode: string };
  phone: string;
  email?: string;
  operatingHours: { open: string; close: string };
  slotDuration?: number;
}

export type UpdateBranchPayload = Partial<CreateBranchPayload>;

// ── Staff ────────────────────────────────

export interface Staff {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "manager" | "staff";
  branchId: string;
  salonId: string;
  specializations?: string[];
  isActive: boolean;
  extraPermissions?: string[];
  deniedPermissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "manager" | "staff";
  specializations?: string[];
}

export interface UpdateStaffPayload {
  name?: string;
  phone?: string;
  specializations?: string[];
  isActive?: boolean;
}

export interface UpdatePermissionsPayload {
  extraPermissions?: string[];
  deniedPermissions?: string[];
}

// ── Service ──────────────────────────────

export interface Service {
  _id: string;
  name: string;
  description?: string;
  category: string;
  price: number; // paise (50000 = ₹500)
  duration: number; // minutes
  branch: string;
  salon: string;
  eligibleStaff: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicePayload {
  name: string;
  description?: string;
  category: string;
  price: number;
  duration: number;
  eligibleStaff?: string[];
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

export interface AssignStaffPayload {
  staffIds: string[];
}

// ── Slot ─────────────────────────────────

export type SlotStatus = "available" | "booked" | "blocked" | "completed";

export interface Slot {
  _id: string;
  staff: string | Staff;
  branch: string;
  salon: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateSlotsPayload {
  staffId: string;
  startDate: string;
  endDate: string;
}

export interface BlockCheckPayload {
  staffId: string;
  date: string;
}

export interface BlockBulkPayload {
  staffId: string;
  date: string;
  reason: string;
  bookedSlotAction: "cancel" | "reassign";
  reassignStaffId?: string;
}

// ── Appointment ──────────────────────────

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  _id: string;
  customer: string | BackendUser;
  staff: string | Staff;
  service: string | Service;
  slot: string | Slot;
  branch: string | Branch;
  salon: string | Salon;
  status: AppointmentStatus;
  customerNotes?: string;
  rating?: number;
  ratingComment?: string;
  rescheduleHistory?: {
    fromSlot: string;
    toSlot: string;
    reason: string;
    rescheduledAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface BookAppointmentPayload {
  slotId: string;
  serviceId: string;
  customerNotes?: string;
}

export interface UpdateStatusPayload {
  status: AppointmentStatus;
}

export interface ReschedulePayload {
  newSlotId: string;
  newServiceId?: string;
  reason?: string;
}

export interface RateAppointmentPayload {
  rating: number;
  comment?: string;
}

// ── Reports ──────────────────────────────

export interface ReportOverview {
  period: { startDate: string; endDate: string };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    confirmed: number;
    noShow: number;
    completionRate: string;
  };
  revenue: { total: number; display: string };
}

export interface PopularService {
  serviceId: string;
  name: string;
  category: string;
  count: number;
  revenue: number;
  revenueDisplay: string;
}

export interface StaffPerformance {
  staffId: string;
  name: string;
  totalAppointments: number;
  completed: number;
  cancelled: number;
  noShow: number;
  revenue: number;
  revenueDisplay: string;
  avgRating: number;
}

export interface DailyBooking {
  date: string;
  count: number;
  revenue: number;
  revenueDisplay: string;
}

export interface SlotUtilization {
  date: string;
  totalSlots: number;
  booked: number;
  available: number;
  blocked: number;
  utilizationRate: string;
}

export interface ReportQueryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  date?: string;
}

// ── Browse (public) ──────────────────────

export interface BrowseSalonParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface BrowseBranchParams {
  city?: string;
  category?: string;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Price helpers ─────────────────────────

export function paiseToINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function inrToPaise(inr: number): number {
  return Math.round(inr * 100);
}