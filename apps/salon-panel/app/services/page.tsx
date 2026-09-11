"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Modal from "@/components/ui/Modal";
import apiClient from "@/lib/api-client";
import {
  Search,
  RefreshCw,
  Plus,
  AlertCircle,
  Clock,
  IndianRupee,
  Pencil,
  Trash2,
  X,
  Scissors,
  Sparkles,
  Palette,
  Wand2,
  Flame,
  Package,
  Tag,
  LayoutGrid,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { useBranch } from "@/hooks/useBranch";
import { getCached, setCache, invalidateCache } from "@/lib/cache";

// ── Types ──

interface ServiceItem {
  _id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  currency: string;
  durationMinutes: number;
  eligibleStaff: string[];
  isActive: boolean;
  createdAt: string;
  priceFormatted?: { display: string };
  packageOfferTag?: string;
  includedServices?: string[];
  image?: string;
  imageUrl?: string;
}

// ── Constants ──

const CATEGORIES = [
  { value: "hair", label: "Hair" },
  { value: "skin", label: "Skin" },
  { value: "nails", label: "Nails" },
  { value: "makeup", label: "Makeup" },
  { value: "spa", label: "Spa" },
  { value: "combo", label: "Combo / Package" },
  { value: "other", label: "Other" },
];

const CATEGORY_THEMES: Record<
  string,
  { bg: string; text: string; badgeBg: string; badgeText: string; icon: any }
> = {
  hair: {
    bg: "bg-purple-50/80 border-purple-100",
    text: "text-purple-600",
    badgeBg: "bg-purple-100/70",
    badgeText: "text-purple-700",
    icon: Scissors,
  },
  skin: {
    bg: "bg-rose-50/80 border-rose-100",
    text: "text-rose-500",
    badgeBg: "bg-rose-100/70",
    badgeText: "text-rose-700",
    icon: Sparkles,
  },
  nails: {
    bg: "bg-pink-50/80 border-pink-100",
    text: "text-pink-600",
    badgeBg: "bg-pink-100/70",
    badgeText: "text-pink-700",
    icon: Palette,
  },
  makeup: {
    bg: "bg-amber-50/80 border-amber-100",
    text: "text-amber-600",
    badgeBg: "bg-amber-100/70",
    badgeText: "text-amber-800",
    icon: Wand2,
  },
  spa: {
    bg: "bg-teal-50/80 border-teal-100",
    text: "text-teal-600",
    badgeBg: "bg-teal-100/70",
    badgeText: "text-teal-800",
    icon: Flame,
  },
  combo: {
    bg: "bg-indigo-50/80 border-indigo-100",
    text: "text-indigo-600",
    badgeBg: "bg-indigo-100/70",
    badgeText: "text-indigo-800",
    icon: Package,
  },
  other: {
    bg: "bg-slate-100/80 border-slate-200",
    text: "text-slate-600",
    badgeBg: "bg-slate-200/70",
    badgeText: "text-slate-700",
    icon: Tag,
  },
};

// ── Helpers ──

function formatPrice(paise: number): string {
  return `₹ ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} h ${m} m` : `${h} h`;
}

// ── Page ──

export default function ServicesPage() {
  const { branchId, canManage } = useBranch();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!branchId) return;

    const cacheKey = `services_${branchId}`;
    const cached = getCached<ServiceItem[]>(cacheKey);

    if (cached) {
      setServices(cached);
      setLoading(false);
      try {
        const { data } = await apiClient.get(`/branches/${branchId}/services`);
        const list = data.data?.services || [];
        setServices(list);
        setCache(cacheKey, list);
      } catch {}
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/branches/${branchId}/services`);
      const list = data.data?.services || [];
      setServices(list);
      setCache(cacheKey, list);
    } catch {
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    setServices([]);
    fetchServices();
  }, [fetchServices]);

  // Filter & Sort
  const filtered = services
    .filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || s.category === categoryFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "duration") return a.durationMinutes - b.durationMinutes;
      return 0;
    });

  // Delete
  async function handleDelete(serviceId: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    setDeletingId(serviceId);
    try {
      await apiClient.delete(`/branches/${branchId}/services/${serviceId}`);
      invalidateCache("services_");
      setServices((prev) => prev.filter((s) => s._id !== serviceId));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete service");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ProtectedRoute page="services">
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Services & Pricing</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Manage your salon services, categories and pricing.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={fetchServices}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 rounded-2xl transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            {canManage && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-xs"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add Service</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200/90 rounded-2xl pl-11 pr-4 py-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-2xs transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters dropdowns */}
          <div className="flex items-center gap-2.5">
            {/* Category Dropdown */}
            <div className="relative flex-1 sm:w-48">
              <LayoutGrid size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-8 py-3 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:border-slate-900 shadow-2xs cursor-pointer"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:w-44">
              <ArrowUpDown size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-8 py-3 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:border-slate-900 shadow-2xs cursor-pointer"
              >
                <option value="name">Name (A - Z)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>
        </div>

        {/* Count Header */}
        <div className="text-xs font-bold text-slate-500 pl-0.5">
          {loading ? "Loading services..." : `${filtered.length} services`}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 text-rose-600 bg-rose-50 border border-rose-200/80 rounded-2xl px-4 py-3 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <p className="flex-1">{error}</p>
            <button onClick={fetchServices} className="underline font-bold hover:text-rose-800">
              Retry
            </button>
          </div>
        )}

        {/* Services Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse" />
                  <div className="w-12 h-6 bg-slate-100 rounded-lg animate-pulse" />
                </div>
                <div className="h-4 bg-slate-100 rounded-lg w-2/3 animate-pulse" />
                <div className="h-4 bg-slate-100 rounded-lg w-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <LayoutGrid size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No services found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || categoryFilter !== "all"
                ? "No services match your active filters."
                : "Add services to start taking bookings for your salon."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((s) => {
              const theme = CATEGORY_THEMES[s.category] || CATEGORY_THEMES.other;
              const IconComp = theme.icon;

              return (
                <div
                  key={s._id}
                  className={`bg-white border border-slate-200/90 rounded-2xl p-5 transition-all hover:shadow-md hover:border-slate-300 flex flex-col justify-between ${
                    s.isActive ? "" : "opacity-60 bg-slate-50/50"
                  }`}
                >
                  <div>
                    {/* Top Row: Icon Badge + Actions */}
                    <div className="flex items-start justify-between mb-4">
                      {/* Pastel Icon Box */}
                      <div className={`w-12 h-12 rounded-2xl ${theme.bg} ${theme.text} flex items-center justify-center shrink-0 border shadow-2xs`}>
                        <IconComp size={22} strokeWidth={2.2} />
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      {canManage && (
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                          <button
                            onClick={() => setEditingService(s)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg transition-colors"
                            title="Edit Service"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(s._id)}
                            disabled={deletingId === s._id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Service"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Title & Category Badge */}
                    <div className="mb-3">
                      <h3 className="font-extrabold text-base text-slate-900 tracking-tight leading-snug">
                        {s.name}
                      </h3>
                      <div className="mt-1.5 inline-block">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md capitalize tracking-wide ${theme.badgeBg} ${theme.badgeText}`}
                        >
                          {s.category}
                        </span>
                      </div>
                    </div>

                    {/* Offer Tag */}
                    {s.packageOfferTag && (
                      <div className="text-[11px] text-amber-800 font-bold mb-3 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80 flex items-center gap-1.5">
                        <span>🏷️</span>
                        <span className="truncate">{s.packageOfferTag}</span>
                      </div>
                    )}

                    {/* Description */}
                    {s.description && (
                      <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                        {s.description}
                      </p>
                    )}

                    {/* Included Services list */}
                    {s.includedServices && s.includedServices.length > 0 && (
                      <div className="mb-4 pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                          Includes ({s.includedServices.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {s.includedServices.map((item, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1"
                            >
                              <Check size={10} strokeWidth={3} />
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Price | Duration */}
                  <div className="flex items-center gap-3 pt-3.5 border-t border-slate-100/90 text-slate-900 font-black">
                    <span className="text-sm tracking-tight">{formatPrice(s.price)}</span>
                    <span className="text-slate-200 font-normal">|</span>
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                      <Clock size={14} className="text-slate-400 shrink-0" />
                      <span>{formatDuration(s.durationMinutes)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <ServiceFormModal
            branchId={branchId}
            onSuccess={() => {
              setShowAddModal(false);
              invalidateCache("services_");
              fetchServices();
            }}
            onClose={() => setShowAddModal(false)}
          />
        )}

        {/* Edit Modal */}
        {editingService && (
          <ServiceFormModal
            branchId={branchId}
            service={editingService}
            onSuccess={() => {
              setEditingService(null);
              invalidateCache("services_");
              fetchServices();
            }}
            onClose={() => setEditingService(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// ── Reusable Add / Edit Modal ──

const SUGGESTED_SUB_SERVICES = [
  "Hairstyling",
  "Nail",
  "Hair color",
  "Body Glowing",
  "Facial",
  "Spa",
  "Eyebrows",
  "Make up",
  "Retouch",
  "Corner Lashes",
  "Draping",
  "Head Massage",
];

function ServiceFormModal({
  branchId,
  service,
  onSuccess,
  onClose,
}: {
  branchId: string;
  service?: ServiceItem;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const isEditing = !!service;

  const [form, setForm] = useState({
    name: service?.name || "",
    description: service?.description || "",
    category: service?.category || "hair",
    price: service ? String(service.price / 100) : "",
    durationMinutes: service ? String(service.durationMinutes) : "",
    packageOfferTag: service?.packageOfferTag || "",
    imageUrl: service?.imageUrl || service?.image || "",
  });

  const [includedServices, setIncludedServices] = useState<string[]>(
    service?.includedServices || []
  );
  const [subServiceInput, setSubServiceInput] = useState("");

  const [fieldErrors, setFieldErrors] = useState<{ field: string; message: string }[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => prev.filter((e) => e.field !== key));
    setServerError(null);
  }

  function getError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  function addSubService(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!includedServices.includes(trimmed)) {
      setIncludedServices((prev) => [...prev, trimmed]);
    }
    setSubServiceInput("");
  }

  function removeSubService(name: string) {
    setIncludedServices((prev) => prev.filter((item) => item !== name));
  }

  async function handleSubmit() {
    const errors: { field: string; message: string }[] = [];
    if (!form.name.trim()) errors.push({ field: "name", message: "Service name is required" });
    if (!form.category) errors.push({ field: "category", message: "Category is required" });
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      errors.push({ field: "price", message: "Enter a valid price in ₹" });
    if (!form.durationMinutes || isNaN(Number(form.durationMinutes)))
      errors.push({ field: "durationMinutes", message: "Duration is required" });

    const priceInPaise = Math.round(Number(form.price) * 100);
    if (priceInPaise < 100) errors.push({ field: "price", message: "Minimum price is ₹1" });
    if (priceInPaise > 10000000) errors.push({ field: "price", message: "Maximum price is ₹1,00,000" });

    const duration = Number(form.durationMinutes);
    if (duration < 15 || duration > 480)
      errors.push({ field: "durationMinutes", message: "Duration must be 15–480 minutes" });

    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setServerError(null);
    setFieldErrors([]);

    const payload: any = {
      name: form.name.trim(),
      category: form.category,
      price: priceInPaise,
      durationMinutes: duration,
      description: form.description.trim() || undefined,
      packageOfferTag: form.packageOfferTag.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      image: form.imageUrl.trim() || undefined,
      includedServices: includedServices.length > 0 ? includedServices : undefined,
    };

    try {
      if (isEditing) {
        await apiClient.patch(`/branches/${branchId}/services/${service!._id}`, payload);
      } else {
        await apiClient.post(`/branches/${branchId}/services`, payload);
      }
      onSuccess();
    } catch (err: any) {
      const res = err.response?.data;
      if (res?.errors && Array.isArray(res.errors)) {
        setFieldErrors(res.errors);
      } else {
        setServerError(res?.message || `Failed to ${isEditing ? "update" : "create"} service`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEditing ? "Edit Service" : "Add New Service"} onClose={onClose}>
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Service Name</label>
          <input
            type="text"
            placeholder="e.g. Hair Cut / Premium Facial"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
          />
          {getError("name") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("name")}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {getError("category") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("category")}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
            />
            {getError("price") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("price")}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              placeholder="e.g. 60"
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
            />
            {getError("durationMinutes") && <p className="text-[11px] text-rose-600 font-medium mt-1">{getError("durationMinutes")}</p>}
          </div>
        </div>

        {/* Combo / Package specific fields */}
        {(form.category === "combo" || includedServices.length > 0) && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-1.5 text-slate-900 font-black text-xs">
              <span>✨ Combo Package Configuration</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Package Offer Tag (optional)</label>
              <input
                type="text"
                placeholder="e.g. Offer valid till Sep 30"
                value={form.packageOfferTag}
                onChange={(e) => set("packageOfferTag", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Included Sub-Services ({includedServices.length})</label>
              {includedServices.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5 bg-white p-2.5 rounded-xl border border-slate-200">
                  {includedServices.map((sub) => (
                    <span
                      key={sub}
                      className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-lg border border-emerald-200/80"
                    >
                      <span>✓ {sub}</span>
                      <button
                        type="button"
                        onClick={() => removeSubService(sub)}
                        className="text-emerald-700 hover:text-rose-600 ml-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom sub-service..."
                  value={subServiceInput}
                  onChange={(e) => setSubServiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubService(subServiceInput);
                    }
                  }}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => addSubService(subServiceInput)}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all shadow-xs"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Description (optional)</label>
          <textarea
            placeholder="Brief description of the service..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
          />
        </div>

        {serverError && (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200/80 rounded-xl px-3 py-2.5 text-xs font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <p>{serverError}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6 border-t border-slate-100 pt-4">
        <button
          onClick={onClose}
          className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs disabled:opacity-50"
        >
          {saving ? "Saving..." : isEditing ? "Update Service" : "Create Service"}
        </button>
      </div>
    </Modal>
  );
}