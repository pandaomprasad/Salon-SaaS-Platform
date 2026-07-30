"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
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
} from "lucide-react";

// ── Types ──

type NotifType = "booking" | "confirmed" | "started" | "completed" | "cancelled" | "no_show";

interface NotifItem {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  time: string;
  date: string;
  appointmentId: string;
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

function buildNotifications(appointments: any[]): NotifItem[] {
  const notifications: NotifItem[] = [];

  appointments.forEach((appt) => {
    const customerName = getName(appt.customerId);
    const serviceName = getName(appt.serviceId);
    const staffName = getName(appt.staffId);
    const history = appt.statusHistory || [];

    history.forEach((entry: any, index: number) => {
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
      });
    });
  });

  notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return notifications;
}

// ── Page ──

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/appointments", { params: { limit: 200 } });
      const apptData = data.data as any;
      const apptList = Array.isArray(apptData) ? apptData : apptData?.appointments || [];
      setNotifications(buildNotifications(apptList));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Load read state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("notification_read_ids");
    if (stored) {
      try {
        setReadIds(new Set(JSON.parse(stored)));
      } catch {
        // ignore
      }
    }
  }, []);

  function markAsRead(id: string) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("notification_read_ids", JSON.stringify([...next]));
      return next;
    });
  }

  function markAllAsRead() {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    localStorage.setItem("notification_read_ids", JSON.stringify([...allIds]));
  }

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !readIds.has(n.id);
    if (filter === "all") return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

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
                    const isRead = readIds.has(n.id);

                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          router.push("/bookings");
                        }}
                        className={`
                          flex items-start gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all
                          ${isRead ? "bg-white hover:bg-smoke/30" : "bg-white border-l-2 border-gold hover:bg-smoke/30"}
                        `}
                      >
                        {/* Icon */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            statusInfo?.bg || "bg-gray-50"
                          } ${statusInfo?.color || "text-gray-500"}`}
                        >
                          {statusInfo?.icon || <Bell size={16} />}
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