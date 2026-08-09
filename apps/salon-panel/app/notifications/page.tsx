"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  CalendarDays,
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertTriangle,
  Bell,
  BellOff,
  CalendarOff,
  CalendarX2,
  CalendarCheck,
} from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/api/services/notificationService";
import type { BackendNotification } from "@/lib/api";

// ── Types ──

type NotifType =
  | "booking"
  | "confirmed"
  | "started"
  | "completed"
  | "cancelled"
  | "no_show"
  | "leave_requested"
  | "leave_approved"
  | "leave_rejected";

interface NotifItem {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  time: string;
  date: string;
  appointmentId?: string;
  leaveId?: string;
  isRead: boolean;
}

interface StatusInfo {
  type: NotifType;
  icon: React.ReactNode;
  color: string;
  bg: string;
  label: string;
}

// ── Helpers ──

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getName(field: unknown): string {
  if (!field) return "Unknown";
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null && "name" in field)
    return (field as { name: string }).name;
  return "Unknown";
}

const STATUS_MAP: Record<string, StatusInfo> = {
  PENDING: {
    type: "booking",
    icon: <CalendarDays size={16} />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "New Booking",
  },
  CONFIRMED: {
    type: "confirmed",
    icon: <CheckCircle size={16} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Confirmed",
  },
  IN_PROGRESS: {
    type: "started",
    icon: <PlayCircle size={16} />,
    color: "text-purple-600",
    bg: "bg-purple-50",
    label: "In Progress",
  },
  COMPLETED: {
    type: "completed",
    icon: <CheckCircle size={16} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    label: "Completed",
  },
  CANCELLED: {
    type: "cancelled",
    icon: <XCircle size={16} />,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Cancelled",
  },
  NO_SHOW: {
    type: "no_show",
    icon: <AlertTriangle size={16} />,
    color: "text-gray-500",
    bg: "bg-gray-50",
    label: "No Show",
  },
};

const BACKEND_TYPE_MAP: Record<string, StatusInfo> = {
  "appointment.status": {
    type: "booking",
    icon: <CalendarDays size={16} />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "Appointment",
  },
  "leave.requested": {
    type: "leave_requested",
    icon: <CalendarOff size={16} />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "Leave Request",
  },
  "leave.approved": {
    type: "leave_approved",
    icon: <CalendarCheck size={16} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    label: "Leave Approved",
  },
  "leave.rejected": {
    type: "leave_rejected",
    icon: <CalendarX2 size={16} />,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Leave Rejected",
  },
};

interface AppointmentLike {
  _id: string;
  customerId?: unknown;
  serviceId?: unknown;
  staffId?: unknown;
  date: string;
  startTime?: string;
  statusHistory?: Array<{ status: string; changedAt: string }>;
}

function buildAppointmentNotifications(
  appointments: AppointmentLike[],
): NotifItem[] {
  const notifications: NotifItem[] = [];

  appointments.forEach((appt) => {
    const customerName = getName(appt.customerId);
    const serviceName = getName(appt.serviceId);
    const staffName = getName(appt.staffId);
    const history = appt.statusHistory || [];

    history.forEach((entry, index) => {
      // Skip duplicate consecutive entries
      if (index > 0 && history[index - 1]?.status === entry.status) return;

      const statusInfo = STATUS_MAP[entry.status];
      if (!statusInfo) return;

      let title = "";
      let description = "";

      switch (entry.status) {
        case "PENDING":
          title = `New booking from ${customerName}`;
          description = `${serviceName} with ${staffName} on ${appt.date} at ${appt.startTime}`;
          break;
        case "CONFIRMED":
          title = `Booking confirmed`;
          description = `${customerName}'s ${serviceName} appointment has been confirmed`;
          break;
        case "IN_PROGRESS":
          title = `Service started`;
          description = `${staffName} started ${serviceName} for ${customerName}`;
          break;
        case "COMPLETED":
          title = `Service completed`;
          description = `${staffName} completed ${serviceName} for ${customerName}`;
          break;
        case "CANCELLED":
          title = `Booking cancelled`;
          description = `${customerName}'s ${serviceName} appointment was cancelled`;
          break;
        case "NO_SHOW":
          title = `Customer no-show`;
          description = `${customerName} didn't show up for ${serviceName}`;
          break;
      }

      notifications.push({
        id: `${appt._id}-${entry.status}-${index}`,
        type: statusInfo.type,
        title,
        description,
        time: entry.changedAt,
        date: appt.date,
        appointmentId: appt._id,
        isRead: false,
      });
    });
  });

  return notifications;
}

function buildBackendNotifications(
  backend: BackendNotification[],
): NotifItem[] {
  return backend.map((n) => {
    const info = BACKEND_TYPE_MAP[n.type] || BACKEND_TYPE_MAP["appointment.status"];
    return {
      id: n._id,
      type: info.type,
      title: n.title,
      description: n.body,
      time: n.createdAt,
      date: n.createdAt,
      leaveId:
        typeof n.data?.leaveId === "string" ? n.data.leaveId : undefined,
      appointmentId:
        typeof n.data?.appointmentId === "string"
          ? n.data.appointmentId
          : undefined,
      isRead: n.isRead,
    };
  });
}

// ── Page ──

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [hasBackend, setHasBackend] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Backend notifications (leave requests/approvals, etc.)
      let backend: BackendNotification[] = [];
      try {
        const { notifications: backendNotifs } = await getNotifications({
          limit: 200,
        });
        backend = backendNotifs;
        setHasBackend(true);
      } catch {
        // backend notification endpoint unavailable — fall back to derived only
      }

      // Appointment status-history derived notifications
      let apptNotifs: NotifItem[] = [];
      try {
        const { data } = await apiClient.get("/appointments", {
          params: { limit: 200 },
        });
        const apptData = data.data as unknown;
        const apptList = Array.isArray(apptData)
          ? (apptData as AppointmentLike[])
          : (apptData as { appointments?: AppointmentLike[] } | null)?.appointments || [];
        apptNotifs = buildAppointmentNotifications(apptList);
      } catch {
        // silent
      }

      const merged = [...buildBackendNotifications(backend), ...apptNotifs];
      merged.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
      );
      setNotifications(merged);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function markAsRead(item: NotifItem) {
    if (item.isRead || readIds.has(item.id)) return;
    setReadIds((prev) => new Set(prev).add(item.id));
    if (hasBackend && item.id.length > 10) {
      markNotificationRead(item.id).catch(() => {});
    }
  }

  async function markAllAsRead() {
    setReadIds(new Set(notifications.map((n) => n.id)));
    if (hasBackend) {
      try {
        await markAllNotificationsRead();
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true })),
        );
      } catch {
        // silent
      }
    }
  }

  function handleClick(item: NotifItem) {
    markAsRead(item);
    if (item.leaveId) {
      router.push("/leaves");
    } else {
      router.push("/bookings");
    }
  }

  const isItemRead = (n: NotifItem) => n.isRead || readIds.has(n.id);

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !isItemRead(n);
    if (filter === "all") return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !isItemRead(n)).length;

  // Group by date
  const grouped: Record<string, NotifItem[]> = {};
  filtered.forEach((n) => {
    const dateKey = new Date(n.time).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(n);
  });

  return (
    <ProtectedRoute page="notifications">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-4xl text-ink">Notifications</h2>
            <p className="text-sm text-ash mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "All caught up"}
            </p>
            <div className="w-8 h-px bg-gold mt-3" />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={fetchNotifications}
              loading={loading}
            >
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: "All" },
            { value: "unread", label: `Unread (${unreadCount})` },
            { value: "booking", label: "Bookings" },
            { value: "confirmed", label: "Confirmed" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
            { value: "leave_requested", label: "Leave Requests" },
            { value: "leave_approved", label: "Leaves Approved" },
            { value: "leave_rejected", label: "Leaves Rejected" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider transition-all border ${
                filter === opt.value
                  ? "bg-ink text-white border-ink"
                  : "bg-white text-ash border-smoke hover:border-silver hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center text-ash py-16 text-sm">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BellOff size={32} className="mx-auto text-silver mb-3" />
            <p className="text-sm text-ash">
              {filter === "unread" ? "No unread notifications." : "No notifications found."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ash mb-3">
                  {dateLabel}
                </p>
                <div className="space-y-1.5">
                  {items.map((n) => {
                    const statusInfo = STATUS_MAP[
                      Object.keys(STATUS_MAP).find(
                        (k) => STATUS_MAP[k].type === n.type,
                      ) || ""
                    ];
                    const isRead = isItemRead(n);
                    const isLeave = !!n.leaveId;

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className={`
                          flex items-start gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all
                          ${isRead ? "bg-white hover:bg-smoke/30" : "bg-white border-l-2 border-gold hover:bg-smoke/30"}
                        `}
                      >
                        {/* Icon */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            (statusInfo?.bg ||
                              BACKEND_TYPE_MAP[isLeave ? "leave.requested" : "appointment.status"]?.bg) ||
                            "bg-gray-50"
                          } ${
                            (statusInfo?.color ||
                              BACKEND_TYPE_MAP[isLeave ? "leave.requested" : "appointment.status"]?.color) ||
                            "text-gray-500"
                          }`}
                        >
                          {(isLeave
                            ? BACKEND_TYPE_MAP["leave.requested"]?.icon
                            : statusInfo?.icon) || <Bell size={16} />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm ${
                                isRead ? "text-ash" : "text-ink font-medium"
                              }`}
                            >
                              {n.title}
                            </p>
                            <span className="text-[10px] text-ash shrink-0 mt-0.5">
                              {timeAgo(n.time)}
                            </span>
                          </div>
                          <p className="text-[11px] text-ash mt-0.5 truncate">{n.description}</p>
                        </div>

                        {/* Unread dot */}
                        {!isRead && (
                          <div className="w-2 h-2 rounded-full bg-gold shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}