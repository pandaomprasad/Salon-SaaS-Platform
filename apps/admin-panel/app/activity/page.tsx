"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import {
  CalendarDays, CheckCircle, XCircle, PlayCircle, UserPlus,
  Building2, RefreshCw, Clock, AlertTriangle,
} from "lucide-react";

interface Activity {
  type: "appointment" | "user" | "salon";
  action: string;
  description: string;
  detail: string;
  timestamp: string;
}

const ACTION_STYLES: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  PENDING:     { icon: <CalendarDays size={14} />, color: "text-amber-600", bg: "bg-amber-50" },
  CONFIRMED:   { icon: <CheckCircle size={14} />, color: "text-blue-600", bg: "bg-blue-50" },
  IN_PROGRESS: { icon: <PlayCircle size={14} />, color: "text-purple-600", bg: "bg-purple-50" },
  COMPLETED:   { icon: <CheckCircle size={14} />, color: "text-emerald-600", bg: "bg-emerald-50" },
  CANCELLED:   { icon: <XCircle size={14} />, color: "text-danger", bg: "bg-danger/5" },
  NO_SHOW:     { icon: <AlertTriangle size={14} />, color: "text-muted", bg: "bg-subtle" },
  REGISTERED:  { icon: <UserPlus size={14} />, color: "text-blue-600", bg: "bg-blue-50" },
  CREATED:     { icon: <Building2 size={14} />, color: "text-accent", bg: "bg-accent-lt" },
};

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/activity", { params: { limit: 50 } });
      setActivities(data.data?.activities || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  // Group by date
  const grouped: Record<string, Activity[]> = {};
  activities.forEach((a) => {
    const key = new Date(a.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Activity Log</h1>
          <p className="text-[13px] text-muted mt-1">Recent actions across the platform</p>
        </div>
        <button onClick={fetchActivity} className="px-3 py-2 text-[12px] text-slate hover:text-ink bg-white border border-border rounded-lg flex items-center gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-center text-muted py-16 text-[13px]">Loading activity...</p>
      ) : activities.length === 0 ? (
        <p className="text-center text-muted py-16 text-[13px]">No activity yet.</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">{dateLabel}</p>
              <div className="bg-white border border-border rounded-xl divide-y divide-border/50">
                {items.map((a, i) => {
                  const style = ACTION_STYLES[a.action] || ACTION_STYLES.CREATED;
                  return (
                    <div key={i} className="flex items-start gap-4 px-5 py-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}>
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${style.bg} ${style.color}`}>
                            {a.action.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-muted capitalize">{a.type}</span>
                        </div>
                        <p className="text-[13px] text-ink mt-1">{a.description}</p>
                        {a.detail && <p className="text-[11px] text-muted mt-0.5">{a.detail}</p>}
                      </div>
                      <span className="text-[11px] text-muted shrink-0">{timeAgo(a.timestamp)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}