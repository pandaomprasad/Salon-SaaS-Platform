"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import apiClient from "@/lib/api-client";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  CalendarDays,
  IndianRupee,
  X,
  Star,
} from "lucide-react";

// ── Types ──

interface CustomerData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  completedVisits: number;
  totalSpent: number;
  lastVisit: string | null;
  avgRating: number | null;
  appointments: AppointmentSummary[];
}

interface AppointmentSummary {
  _id: string;
  date: string;
  startTime: string;
  serviceName: string;
  staffName: string;
  status: string;
  price: number;
  rating?: number;
}

// ── Helpers ──

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-purple-50 text-purple-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-500",
  NO_SHOW: "bg-gray-100 text-gray-500",
};

// ── Extract customers from appointments ──

function extractCustomers(appointments: any[]): CustomerData[] {
  const map: Record<string, CustomerData> = {};

  appointments.forEach((a) => {
    const customer = a.customerId;
    if (!customer || typeof customer !== "object") return;

    const id = customer._id;

    if (!map[id]) {
      map[id] = {
        _id: id,
        name: customer.name || "Unknown",
        email: customer.email || "",
        phone: customer.phone || "",
        totalVisits: 0,
        completedVisits: 0,
        totalSpent: 0,
        lastVisit: null,
        avgRating: null,
        appointments: [],
      };
    }

    const c = map[id];
    c.totalVisits++;

    if (a.status === "COMPLETED") {
      c.completedVisits++;
      c.totalSpent += a.pricePaid || a.serviceId?.price || 0;
    }

    if (!c.lastVisit || a.date > c.lastVisit) {
      c.lastVisit = a.date;
    }

    const rating = a.rating?.score || null;

    c.appointments.push({
      _id: a._id,
      date: a.date || "—",
      startTime: a.startTime || "—",
      serviceName: a.serviceId?.name || "—",
      staffName: a.staffId?.name || "—",
      status: a.status,
      price: a.pricePaid || a.serviceId?.price || 0,
      rating: rating,
    });
  });

  // Calculate avg rating
  Object.values(map).forEach((c) => {
    const ratings = c.appointments.filter((a) => a.rating).map((a) => a.rating!);
    if (ratings.length > 0) {
      c.avgRating = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
    }
    // Sort appointments by date desc
    c.appointments.sort((a, b) => (b.date > a.date ? 1 : -1));
  });

  // Sort customers by total visits desc
  return Object.values(map).sort((a, b) => b.totalVisits - a.totalVisits);
}

// ── Page ──

export default function CustomersPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("visits");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get("/appointments", {
        params: { limit: 500 },
      });
      const appointments = (data.data as any)?.appointments || data.data || [];
      const list = Array.isArray(appointments) ? appointments : [];
      setCustomers(extractCustomers(list));
    } catch {
      setError("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filter + sort
  const filtered = customers
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "visits") return b.totalVisits - a.totalVisits;
      if (sortBy === "spent") return b.totalSpent - a.totalSpent;
      if (sortBy === "recent") return (b.lastVisit || "") > (a.lastVisit || "") ? 1 : -1;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <ProtectedRoute page="customers">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display">Customers</h2>
            <p className="text-sm text-ash mt-1">
              {loading ? "Loading..." : `${filtered.length} customers`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={13} />}
            onClick={fetchCustomers}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-60">
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
          <div className="w-44">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: "visits", label: "Most Visits" },
                { value: "spent", label: "Most Spent" },
                { value: "recent", label: "Most Recent" },
                { value: "name", label: "Name A–Z" },
              ]}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-4 py-3">
            <AlertCircle size={14} />
            <p className="text-sm">{error}</p>
            <Button size="sm" variant="ghost" onClick={fetchCustomers}>
              Retry
            </Button>
          </div>
        )}

        {/* Customer Table */}
        {loading ? (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="border-b border-border bg-subtle px-5 py-3 flex gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-border/50 rounded h-3 flex-1" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, r) => (
              <div key={r} className="px-5 py-4 flex gap-4 border-b border-border/50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="animate-pulse bg-border/50 rounded-lg w-8 h-8" />
                  <div className="space-y-1.5 flex-1">
                    <div className="animate-pulse bg-border/50 rounded h-3.5 w-1/3" />
                    <div className="animate-pulse bg-border/50 rounded h-3 w-1/2" />
                  </div>
                </div>
                {Array.from({ length: 5 }).map((_, c) => (
                  <div key={c} className="animate-pulse bg-border/50 rounded h-3.5 flex-1" />
                ))}
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-ash py-12 text-sm">
            No customers found. Customers will appear here once they make bookings.
          </div>
        ) : (
          <div className="bg-white border border-smoke rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-smoke bg-smoke/40">
                    {["Customer", "Phone", "Visits", "Completed", "Total Spent", "Avg Rating", "Last Visit"].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-ash px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => setSelectedCustomer(c)}
                      className="border-b border-smoke/50 hover:bg-smoke/20 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center text-[10px] font-semibold shrink-0">
                            {getInitials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{c.name}</p>
                            <p className="text-[11px] text-ash truncate">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-ash">{c.phone || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium">{c.totalVisits}</span>
                      </td>
                      <td className="px-5 py-3.5 text-ash">{c.completedVisits}</td>
                      <td className="px-5 py-3.5 font-medium">
                        ₹{(c.totalSpent / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5">
                        {c.avgRating ? (
                          <span className="flex items-center gap-1 text-gold">
                            <Star size={11} className="fill-gold" />
                            {c.avgRating}
                          </span>
                        ) : (
                          <span className="text-ash">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-ash">
                        {c.lastVisit ? timeAgo(c.lastVisit) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Detail Drawer */}
        {selectedCustomer && (
          <CustomerDrawer
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// ── Customer Detail Drawer ──

function CustomerDrawer({
  customer: c,
  onClose,
}: {
  customer: CustomerData;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-end p-6"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-ink text-white flex items-center justify-center text-sm font-semibold">
              {getInitials(c.name)}
            </div>
            <div>
              <h3 className="font-semibold text-base">{c.name}</h3>
              {c.avgRating && (
                <span className="flex items-center gap-0.5 text-xs text-gold">
                  <Star size={11} className="fill-gold" />
                  {c.avgRating} avg rating
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-ash hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Contact */}
        <div className="space-y-2 text-sm mb-5">
          <div className="flex items-center gap-2 text-ash">
            <Mail size={13} />
            <span>{c.email}</span>
          </div>
          {c.phone && (
            <div className="flex items-center gap-2 text-ash">
              <Phone size={13} />
              <span>{c.phone}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-smoke/50 rounded-xl p-3 text-center">
            <p className="text-lg font-semibold">{c.totalVisits}</p>
            <p className="text-[10px] text-ash uppercase tracking-wide">Total Visits</p>
          </div>
          <div className="bg-smoke/50 rounded-xl p-3 text-center">
            <p className="text-lg font-semibold">{c.completedVisits}</p>
            <p className="text-[10px] text-ash uppercase tracking-wide">Completed</p>
          </div>
          <div className="bg-smoke/50 rounded-xl p-3 text-center">
            <p className="text-lg font-semibold">₹{(c.totalSpent / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-ash uppercase tracking-wide">Total Spent</p>
          </div>
        </div>

        {/* Appointment History */}
        <div>
          <p className="text-xs font-medium text-ash uppercase tracking-wide mb-3">
            Appointment History
          </p>
          {c.appointments.length === 0 ? (
            <p className="text-sm text-ash">No appointments yet.</p>
          ) : (
            <div className="space-y-2">
              {c.appointments.map((a) => (
                <div
                  key={a._id}
                  className="bg-white border border-smoke/60 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{a.serviceName}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[a.status] || "bg-gray-100 text-gray-500"
                        }`}
                    >
                      {a.status.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ash">
                    <span>{a.date}</span>
                    <span>{a.startTime}</span>
                    <span>with {a.staffName}</span>
                    <span className="ml-auto font-medium text-ink">
                      ₹{(a.price / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {a.rating && (
                    <div className="mt-1 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < a.rating! ? "text-gold fill-gold" : "text-silver"}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}